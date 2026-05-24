import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents, trips, vehicles } from "@db/schema";
import { and, avg, count, eq, gte, lt, max, ne, sql, sum } from "drizzle-orm";
import {
  BASELINE_WINDOW_DAYS,
  DUE_SOON_THRESHOLD_DAYS,
  RECENT_WINDOW_DAYS,
  SERVICE_INTERVAL_MONTHS,
  type AttentionRow,
} from "./config";

const isServiceOverdueSql = () =>
  sql<boolean>`${vehicles.lastServiceAt} is not null and now() - ${vehicles.lastServiceAt} > interval '${sql.raw(SERVICE_INTERVAL_MONTHS.toString())} months'`;

const isServiceDueSoonSql = () =>
  sql<boolean>`${vehicles.lastServiceAt} is not null and now() - ${vehicles.lastServiceAt} > interval '${sql.raw(SERVICE_INTERVAL_MONTHS.toString())} months' - interval '${sql.raw(DUE_SOON_THRESHOLD_DAYS.toString())} days' and now() - ${vehicles.lastServiceAt} <= interval '${sql.raw(SERVICE_INTERVAL_MONTHS.toString())} months'`;

export const loadAttentionRows = async (): Promise<AttentionRow[]> => {
  const recentSinceSql = sql`now() - interval '1 day' * ${RECENT_WINDOW_DAYS}`;
  const baselineSinceSql = sql`now() - interval '1 day' * ${BASELINE_WINDOW_DAYS + RECENT_WINDOW_DAYS}`;
  const baselineUntilSql = sql`now() - interval '1 day' * ${RECENT_WINDOW_DAYS}`;

  const recentFuelLiters = db.$with("recent_fuel_liters").as(
    db
      .select({
        vehicleId: fuelTransactions.vehicleId,
        liters: sum(fuelTransactions.liters).mapWith(Number).as("liters"),
      })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, recentSinceSql))
      .groupBy(fuelTransactions.vehicleId),
  );

  const recentDistance = db.$with("recent_distance").as(
    db
      .select({
        vehicleId: trips.vehicleId,
        distanceKm: sum(trips.distanceKm).mapWith(Number).as("distance_km"),
      })
      .from(trips)
      .where(gte(trips.startedAt, recentSinceSql))
      .groupBy(trips.vehicleId),
  );

  const recentFuelCost = db.$with("recent_fuel_cost").as(
    db
      .select({
        vehicleId: fuelTransactions.vehicleId,
        cost: sum(fuelTransactions.cost).mapWith(Number).as("cost"),
      })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, recentSinceSql))
      .groupBy(fuelTransactions.vehicleId),
  );

  const recentMaintenanceCost = db.$with("recent_maintenance_cost").as(
    db
      .select({
        vehicleId: maintenanceEvents.vehicleId,
        cost: sum(maintenanceEvents.cost).mapWith(Number).as("cost"),
      })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, recentSinceSql),
          sql`${maintenanceEvents.cost} is not null`,
        ),
      )
      .groupBy(maintenanceEvents.vehicleId),
  );

  const lastTrip = db.$with("last_trip").as(
    db
      .select({
        vehicleId: trips.vehicleId,
        lastStartedAt: max(trips.startedAt).as("last_started_at"),
      })
      .from(trips)
      .groupBy(trips.vehicleId),
  );

  const baselineFuelLitersWeek = db.$with("baseline_fuel_liters_week").as(
    db
      .select({
        vehicleId: fuelTransactions.vehicleId,
        week: sql<Date>`date_trunc('week', ${fuelTransactions.transactionAt})`.as("week"),
        liters: sum(fuelTransactions.liters).mapWith(Number).as("liters"),
      })
      .from(fuelTransactions)
      .where(
        and(
          gte(fuelTransactions.transactionAt, baselineSinceSql),
          lt(fuelTransactions.transactionAt, baselineUntilSql),
        ),
      )
      .groupBy(
        fuelTransactions.vehicleId,
        sql`date_trunc('week', ${fuelTransactions.transactionAt})`,
      ),
  );

  const baselineDistanceWeek = db.$with("baseline_distance_week").as(
    db
      .select({
        vehicleId: trips.vehicleId,
        week: sql<Date>`date_trunc('week', ${trips.startedAt})`.as("week"),
        distanceKm: sum(trips.distanceKm).mapWith(Number).as("distance_km"),
      })
      .from(trips)
      .where(and(gte(trips.startedAt, baselineSinceSql), lt(trips.startedAt, baselineUntilSql)))
      .groupBy(trips.vehicleId, sql`date_trunc('week', ${trips.startedAt})`),
  );

  const baselineFuelEfficiencyWeek = db.$with("baseline_fuel_efficiency_week").as(
    db
      .select({
        vehicleId: baselineFuelLitersWeek.vehicleId,
        lPer100Km:
          sql<number>`${baselineFuelLitersWeek.liters} / ${baselineDistanceWeek.distanceKm} * 100`
            .mapWith(Number)
            .as("l_per_100km"),
      })
      .from(baselineFuelLitersWeek)
      .innerJoin(
        baselineDistanceWeek,
        and(
          eq(baselineDistanceWeek.vehicleId, baselineFuelLitersWeek.vehicleId),
          eq(baselineDistanceWeek.week, baselineFuelLitersWeek.week),
        ),
      )
      .where(sql`${baselineDistanceWeek.distanceKm} > 0`),
  );

  const baselineFuelStats = db.$with("baseline_fuel_stats").as(
    db
      .select({
        vehicleId: baselineFuelEfficiencyWeek.vehicleId,
        avgL100: avg(baselineFuelEfficiencyWeek.lPer100Km).mapWith(Number).as("avg_l100"),
        stddevL100: sql<number>`coalesce(stddev_samp(${baselineFuelEfficiencyWeek.lPer100Km}), 0)`
          .mapWith(Number)
          .as("stddev_l100"),
        samples: count(baselineFuelEfficiencyWeek.lPer100Km).as("samples"),
      })
      .from(baselineFuelEfficiencyWeek)
      .groupBy(baselineFuelEfficiencyWeek.vehicleId),
  );

  const baselineFuelCostWeek = db.$with("baseline_fuel_cost_week").as(
    db
      .select({
        vehicleId: fuelTransactions.vehicleId,
        week: sql<Date>`date_trunc('week', ${fuelTransactions.transactionAt})`.as("week"),
        cost: sum(fuelTransactions.cost).mapWith(Number).as("cost"),
      })
      .from(fuelTransactions)
      .where(
        and(
          gte(fuelTransactions.transactionAt, baselineSinceSql),
          lt(fuelTransactions.transactionAt, baselineUntilSql),
        ),
      )
      .groupBy(
        fuelTransactions.vehicleId,
        sql`date_trunc('week', ${fuelTransactions.transactionAt})`,
      ),
  );

  const baselineFuelCostStats = db.$with("baseline_fuel_cost_stats").as(
    db
      .select({
        vehicleId: baselineFuelCostWeek.vehicleId,
        avgCost: avg(baselineFuelCostWeek.cost).mapWith(Number).as("avg_cost"),
        stddevCost: sql<number>`coalesce(stddev_samp(${baselineFuelCostWeek.cost}), 0)`
          .mapWith(Number)
          .as("stddev_cost"),
        samples: count(baselineFuelCostWeek.cost).as("samples"),
      })
      .from(baselineFuelCostWeek)
      .groupBy(baselineFuelCostWeek.vehicleId),
  );

  const baselineMaintenanceCostWeek = db.$with("baseline_maintenance_cost_week").as(
    db
      .select({
        vehicleId: maintenanceEvents.vehicleId,
        week: sql<Date>`date_trunc('week', ${maintenanceEvents.eventAt})`.as("week"),
        cost: sum(maintenanceEvents.cost).mapWith(Number).as("cost"),
      })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, baselineSinceSql),
          lt(maintenanceEvents.eventAt, baselineUntilSql),
          sql`${maintenanceEvents.cost} is not null`,
        ),
      )
      .groupBy(maintenanceEvents.vehicleId, sql`date_trunc('week', ${maintenanceEvents.eventAt})`),
  );

  const baselineMaintenanceCostStats = db.$with("baseline_maintenance_cost_stats").as(
    db
      .select({
        vehicleId: baselineMaintenanceCostWeek.vehicleId,
        avgCost: avg(baselineMaintenanceCostWeek.cost).mapWith(Number).as("avg_cost"),
        stddevCost: sql<number>`coalesce(stddev_samp(${baselineMaintenanceCostWeek.cost}), 0)`
          .mapWith(Number)
          .as("stddev_cost"),
        samples: count(baselineMaintenanceCostWeek.cost).as("samples"),
      })
      .from(baselineMaintenanceCostWeek)
      .groupBy(baselineMaintenanceCostWeek.vehicleId),
  );

  return db
    .with(
      recentFuelLiters,
      recentDistance,
      recentFuelCost,
      recentMaintenanceCost,
      lastTrip,
      baselineFuelLitersWeek,
      baselineDistanceWeek,
      baselineFuelEfficiencyWeek,
      baselineFuelStats,
      baselineFuelCostWeek,
      baselineFuelCostStats,
      baselineMaintenanceCostWeek,
      baselineMaintenanceCostStats,
    )
    .select({
      vehicleId: vehicles.id,
      plateNumber: vehicles.plateNumber,
      make: vehicles.make,
      model: vehicles.model,
      status: vehicles.status,
      isServiceOverdue: isServiceOverdueSql(),
      isServiceDueSoon: isServiceDueSoonSql(),
      recentFuelLiters: sql<number>`coalesce(${recentFuelLiters.liters}, 0)`.mapWith(Number),
      recentDistanceKm: sql<number>`coalesce(${recentDistance.distanceKm}, 0)`.mapWith(Number),
      recentFuelCost: sql<number>`coalesce(${recentFuelCost.cost}, 0)`.mapWith(Number),
      recentMaintenanceCost: sql<number>`coalesce(${recentMaintenanceCost.cost}, 0)`.mapWith(
        Number,
      ),
      lastStartedAt: lastTrip.lastStartedAt,
      baselineFuelAvg: baselineFuelStats.avgL100,
      baselineFuelStddev: baselineFuelStats.stddevL100,
      baselineFuelSamples: baselineFuelStats.samples,
      baselineFuelCostAvg: baselineFuelCostStats.avgCost,
      baselineFuelCostStddev: baselineFuelCostStats.stddevCost,
      baselineFuelCostSamples: baselineFuelCostStats.samples,
      baselineMaintenanceCostAvg: baselineMaintenanceCostStats.avgCost,
      baselineMaintenanceCostStddev: baselineMaintenanceCostStats.stddevCost,
      baselineMaintenanceCostSamples: baselineMaintenanceCostStats.samples,
    })
    .from(vehicles)
    .leftJoin(recentFuelLiters, eq(recentFuelLiters.vehicleId, vehicles.id))
    .leftJoin(recentDistance, eq(recentDistance.vehicleId, vehicles.id))
    .leftJoin(recentFuelCost, eq(recentFuelCost.vehicleId, vehicles.id))
    .leftJoin(recentMaintenanceCost, eq(recentMaintenanceCost.vehicleId, vehicles.id))
    .leftJoin(lastTrip, eq(lastTrip.vehicleId, vehicles.id))
    .leftJoin(baselineFuelStats, eq(baselineFuelStats.vehicleId, vehicles.id))
    .leftJoin(baselineFuelCostStats, eq(baselineFuelCostStats.vehicleId, vehicles.id))
    .leftJoin(baselineMaintenanceCostStats, eq(baselineMaintenanceCostStats.vehicleId, vehicles.id))
    .where(ne(vehicles.status, "retired"));
};
