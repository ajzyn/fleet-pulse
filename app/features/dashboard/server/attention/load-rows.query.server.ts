import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents, trips, vehicles } from "@db/schema";
import { and, avg, count, eq, gte, lt, max, ne, sql, sum, type SQL } from "drizzle-orm";
import {
  BASELINE_WINDOW_DAYS,
  DUE_SOON_THRESHOLD_DAYS,
  RECENT_WINDOW_DAYS,
  SERVICE_INTERVAL_MONTHS,
} from "./config";
import type { AttentionRow } from "./types";

const isServiceOverdueSql = () =>
  sql<boolean>`${vehicles.lastServiceAt} is not null and now() - ${vehicles.lastServiceAt} > interval '${sql.raw(SERVICE_INTERVAL_MONTHS.toString())} months'`;

const isServiceDueSoonSql = () =>
  sql<boolean>`${vehicles.lastServiceAt} is not null and now() - ${vehicles.lastServiceAt} > interval '${sql.raw(SERVICE_INTERVAL_MONTHS.toString())} months' - interval '${sql.raw(DUE_SOON_THRESHOLD_DAYS.toString())} days' and now() - ${vehicles.lastServiceAt} <= interval '${sql.raw(SERVICE_INTERVAL_MONTHS.toString())} months'`;

const buildRecentFuelLitersCte = (since: SQL) =>
  db.$with("recent_fuel_liters").as(
    db
      .select({
        vehicleId: fuelTransactions.vehicleId,
        liters: sum(fuelTransactions.liters).mapWith(Number).as("liters"),
      })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, since))
      .groupBy(fuelTransactions.vehicleId),
  );

const buildRecentDistanceCte = (since: SQL) =>
  db.$with("recent_distance").as(
    db
      .select({
        vehicleId: trips.vehicleId,
        distanceKm: sum(trips.distanceKm).mapWith(Number).as("distance_km"),
      })
      .from(trips)
      .where(gte(trips.startedAt, since))
      .groupBy(trips.vehicleId),
  );

const buildRecentFuelCostCte = (since: SQL) =>
  db.$with("recent_fuel_cost").as(
    db
      .select({
        vehicleId: fuelTransactions.vehicleId,
        cost: sum(fuelTransactions.cost).mapWith(Number).as("recent_fuel_cost"),
      })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, since))
      .groupBy(fuelTransactions.vehicleId),
  );

const buildRecentMaintenanceCostCte = (since: SQL) =>
  db.$with("recent_maintenance_cost").as(
    db
      .select({
        vehicleId: maintenanceEvents.vehicleId,
        cost: sum(maintenanceEvents.cost).mapWith(Number).as("recent_maintenance_cost"),
      })
      .from(maintenanceEvents)
      .where(and(gte(maintenanceEvents.eventAt, since), sql`${maintenanceEvents.cost} is not null`))
      .groupBy(maintenanceEvents.vehicleId),
  );

const buildLastTripCte = () =>
  db.$with("last_trip").as(
    db
      .select({
        vehicleId: trips.vehicleId,
        lastStartedAt: max(trips.startedAt).as("last_started_at"),
      })
      .from(trips)
      .groupBy(trips.vehicleId),
  );

const buildBaselineFuelLitersWeekCte = (since: SQL, until: SQL) =>
  db.$with("baseline_fuel_liters_week").as(
    db
      .select({
        vehicleId: fuelTransactions.vehicleId,
        week: sql<Date>`date_trunc('week', ${fuelTransactions.transactionAt})`.as("fuel_week"),
        liters: sum(fuelTransactions.liters).mapWith(Number).as("liters"),
      })
      .from(fuelTransactions)
      .where(
        and(gte(fuelTransactions.transactionAt, since), lt(fuelTransactions.transactionAt, until)),
      )
      .groupBy(
        fuelTransactions.vehicleId,
        sql`date_trunc('week', ${fuelTransactions.transactionAt})`,
      ),
  );

const buildBaselineDistanceWeekCte = (since: SQL, until: SQL) =>
  db.$with("baseline_distance_week").as(
    db
      .select({
        vehicleId: trips.vehicleId,
        week: sql<Date>`date_trunc('week', ${trips.startedAt})`.as("distance_week"),
        distanceKm: sum(trips.distanceKm).mapWith(Number).as("distance_km"),
      })
      .from(trips)
      .where(and(gte(trips.startedAt, since), lt(trips.startedAt, until)))
      .groupBy(trips.vehicleId, sql`date_trunc('week', ${trips.startedAt})`),
  );

const buildBaselineFuelEfficiencyWeekCte = (
  litersCte: ReturnType<typeof buildBaselineFuelLitersWeekCte>,
  distanceCte: ReturnType<typeof buildBaselineDistanceWeekCte>,
) =>
  db.$with("baseline_fuel_efficiency_week").as(
    db
      .select({
        vehicleId: litersCte.vehicleId,
        lPer100Km: sql<number>`${litersCte.liters} / ${distanceCte.distanceKm} * 100`
          .mapWith(Number)
          .as("l_per_100km"),
      })
      .from(litersCte)
      .innerJoin(
        distanceCte,
        and(eq(distanceCte.vehicleId, litersCte.vehicleId), eq(distanceCte.week, litersCte.week)),
      )
      .where(sql`${distanceCte.distanceKm} > 0`),
  );

const buildBaselineFuelStatsCte = (
  efficiencyCte: ReturnType<typeof buildBaselineFuelEfficiencyWeekCte>,
) =>
  db.$with("baseline_fuel_stats").as(
    db
      .select({
        vehicleId: efficiencyCte.vehicleId,
        avgL100: avg(efficiencyCte.lPer100Km).mapWith(Number).as("avg_l100"),
        stddevL100: sql<number>`coalesce(stddev_samp(${efficiencyCte.lPer100Km}), 0)`
          .mapWith(Number)
          .as("stddev_l100"),
        samples: count(efficiencyCte.lPer100Km).as("fuel_stats_samples"),
      })
      .from(efficiencyCte)
      .groupBy(efficiencyCte.vehicleId),
  );

const buildBaselineFuelCostWeekCte = (since: SQL, until: SQL) =>
  db.$with("baseline_fuel_cost_week").as(
    db
      .select({
        vehicleId: fuelTransactions.vehicleId,
        week: sql<Date>`date_trunc('week', ${fuelTransactions.transactionAt})`.as("week"),
        cost: sum(fuelTransactions.cost).mapWith(Number).as("cost"),
      })
      .from(fuelTransactions)
      .where(
        and(gte(fuelTransactions.transactionAt, since), lt(fuelTransactions.transactionAt, until)),
      )
      .groupBy(
        fuelTransactions.vehicleId,
        sql`date_trunc('week', ${fuelTransactions.transactionAt})`,
      ),
  );

const buildBaselineFuelCostStatsCte = (
  costWeekCte: ReturnType<typeof buildBaselineFuelCostWeekCte>,
) =>
  db.$with("baseline_fuel_cost_stats").as(
    db
      .select({
        vehicleId: costWeekCte.vehicleId,
        avgCost: avg(costWeekCte.cost).mapWith(Number).as("fuel_avg_cost"),
        stddevCost: sql<number>`coalesce(stddev_samp(${costWeekCte.cost}), 0)`
          .mapWith(Number)
          .as("fuel_stddev_cost"),
        samples: count(costWeekCte.cost).as("fuel_cost_stats_samples"),
      })
      .from(costWeekCte)
      .groupBy(costWeekCte.vehicleId),
  );

const buildBaselineMaintenanceCostWeekCte = (since: SQL, until: SQL) =>
  db.$with("baseline_maintenance_cost_week").as(
    db
      .select({
        vehicleId: maintenanceEvents.vehicleId,
        week: sql<Date>`date_trunc('week', ${maintenanceEvents.eventAt})`.as("week"),
        cost: sum(maintenanceEvents.cost).mapWith(Number).as("cost"),
      })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, since),
          lt(maintenanceEvents.eventAt, until),
          sql`${maintenanceEvents.cost} is not null`,
        ),
      )
      .groupBy(maintenanceEvents.vehicleId, sql`date_trunc('week', ${maintenanceEvents.eventAt})`),
  );

const buildBaselineMaintenanceCostStatsCte = (
  costWeekCte: ReturnType<typeof buildBaselineMaintenanceCostWeekCte>,
) =>
  db.$with("baseline_maintenance_cost_stats").as(
    db
      .select({
        vehicleId: costWeekCte.vehicleId,
        avgCost: avg(costWeekCte.cost).mapWith(Number).as("maintenance_avg_cost"),
        stddevCost: sql<number>`coalesce(stddev_samp(${costWeekCte.cost}), 0)`
          .mapWith(Number)
          .as("maintenance_stddev_cost"),
        samples: count(costWeekCte.cost).as("maintenance_cost_stats_samples"),
      })
      .from(costWeekCte)
      .groupBy(costWeekCte.vehicleId),
  );

export const loadAttentionRows = async (): Promise<AttentionRow[]> => {
  const recentSinceSql = sql`now() - interval '1 day' * ${RECENT_WINDOW_DAYS}`;
  const baselineSinceSql = sql`now() - interval '1 day' * ${BASELINE_WINDOW_DAYS + RECENT_WINDOW_DAYS}`;
  const baselineUntilSql = sql`now() - interval '1 day' * ${RECENT_WINDOW_DAYS}`;

  const recentFuelLiters = buildRecentFuelLitersCte(recentSinceSql);
  const recentDistance = buildRecentDistanceCte(recentSinceSql);
  const recentFuelCost = buildRecentFuelCostCte(recentSinceSql);
  const recentMaintenanceCost = buildRecentMaintenanceCostCte(recentSinceSql);
  const lastTrip = buildLastTripCte();

  const baselineFuelLitersWeek = buildBaselineFuelLitersWeekCte(baselineSinceSql, baselineUntilSql);
  const baselineDistanceWeek = buildBaselineDistanceWeekCte(baselineSinceSql, baselineUntilSql);
  const baselineFuelEfficiencyWeek = buildBaselineFuelEfficiencyWeekCte(
    baselineFuelLitersWeek,
    baselineDistanceWeek,
  );
  const baselineFuelStats = buildBaselineFuelStatsCte(baselineFuelEfficiencyWeek);

  const baselineFuelCostWeek = buildBaselineFuelCostWeekCte(baselineSinceSql, baselineUntilSql);
  const baselineFuelCostStats = buildBaselineFuelCostStatsCte(baselineFuelCostWeek);

  const baselineMaintenanceCostWeek = buildBaselineMaintenanceCostWeekCte(
    baselineSinceSql,
    baselineUntilSql,
  );
  const baselineMaintenanceCostStats = buildBaselineMaintenanceCostStatsCte(
    baselineMaintenanceCostWeek,
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
