import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents, trips, vehicles } from "@db/schema";
import { and, avg, count, eq, gte, lt, max, ne, sql, sum } from "drizzle-orm";
import type { ChipKind } from "../types";

interface AttentionItem {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  status: "active" | "in_maintenance";
  chips: ChipKind[];
  severityScore: number;
}

const SEVERITY: Record<ChipKind, number> = {
  overdue_maintenance: 100,
  cost_anomaly: 70,
  fuel_anomaly: 50,
  maintenance_due_soon: 30,
  idle_too_long: 20,
};

const RECENT_DAYS = 30;
const BASELINE_DAYS = 90;
const IDLE_DAYS = 14;
const DUE_SOON_DAYS = 7;
const SERVICE_INTERVAL_MONTHS = 12;
const MIN_BASELINE_WEEKS = 4;
const SIGMA = 2;
const TOP = 10;

export const getNeedsAttention = async (): Promise<AttentionItem[]> => {
  const recentSince = sql`now() - interval '1 day' * ${RECENT_DAYS}`;
  const baselineSince = sql`now() - interval '1 day' * ${BASELINE_DAYS + RECENT_DAYS}`;
  const baselineUntil = sql`now() - interval '1 day' * ${RECENT_DAYS}`;

  const recentLiters = db.$with("recent_liters").as(
    db
      .select({
        vehicleId: fuelTransactions.vehicleId,
        liters: sum(fuelTransactions.liters).mapWith(Number).as("liters"),
      })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, recentSince))
      .groupBy(fuelTransactions.vehicleId),
  );

  const recentDistance = db.$with("recent_distance").as(
    db
      .select({
        vehicleId: trips.vehicleId,
        distanceKm: sum(trips.distanceKm).mapWith(Number).as("distance_km"),
      })
      .from(trips)
      .where(gte(trips.startedAt, recentSince))
      .groupBy(trips.vehicleId),
  );

  const recentFuelCost = db.$with("recent_fuel_cost").as(
    db
      .select({
        vehicleId: fuelTransactions.vehicleId,
        cost: sum(fuelTransactions.cost).mapWith(Number).as("cost"),
      })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, recentSince))
      .groupBy(fuelTransactions.vehicleId),
  );

  const recentMaintCost = db.$with("recent_maint_cost").as(
    db
      .select({
        vehicleId: maintenanceEvents.vehicleId,
        cost: sum(maintenanceEvents.cost).mapWith(Number).as("cost"),
      })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, recentSince),
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
          gte(fuelTransactions.transactionAt, baselineSince),
          lt(fuelTransactions.transactionAt, baselineUntil),
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
      .where(and(gte(trips.startedAt, baselineSince), lt(trips.startedAt, baselineUntil)))
      .groupBy(trips.vehicleId, sql`date_trunc('week', ${trips.startedAt})`),
  );

  const baselineFuelL100Week = db.$with("baseline_fuel_l100_week").as(
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
        vehicleId: baselineFuelL100Week.vehicleId,
        avgL100: avg(baselineFuelL100Week.lPer100Km).mapWith(Number).as("avg_l100"),
        stddevL100: sql<number>`coalesce(stddev_samp(${baselineFuelL100Week.lPer100Km}), 0)`
          .mapWith(Number)
          .as("stddev_l100"),
        samples: count(baselineFuelL100Week.lPer100Km).as("samples"),
      })
      .from(baselineFuelL100Week)
      .groupBy(baselineFuelL100Week.vehicleId),
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
          gte(fuelTransactions.transactionAt, baselineSince),
          lt(fuelTransactions.transactionAt, baselineUntil),
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

  const baselineMaintCostWeek = db.$with("baseline_maint_cost_week").as(
    db
      .select({
        vehicleId: maintenanceEvents.vehicleId,
        week: sql<Date>`date_trunc('week', ${maintenanceEvents.eventAt})`.as("week"),
        cost: sum(maintenanceEvents.cost).mapWith(Number).as("cost"),
      })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, baselineSince),
          lt(maintenanceEvents.eventAt, baselineUntil),
          sql`${maintenanceEvents.cost} is not null`,
        ),
      )
      .groupBy(maintenanceEvents.vehicleId, sql`date_trunc('week', ${maintenanceEvents.eventAt})`),
  );

  const baselineMaintCostStats = db.$with("baseline_maint_cost_stats").as(
    db
      .select({
        vehicleId: baselineMaintCostWeek.vehicleId,
        avgCost: avg(baselineMaintCostWeek.cost).mapWith(Number).as("avg_cost"),
        stddevCost: sql<number>`coalesce(stddev_samp(${baselineMaintCostWeek.cost}), 0)`
          .mapWith(Number)
          .as("stddev_cost"),
        samples: count(baselineMaintCostWeek.cost).as("samples"),
      })
      .from(baselineMaintCostWeek)
      .groupBy(baselineMaintCostWeek.vehicleId),
  );

  const rows = await db
    .with(
      recentLiters,
      recentDistance,
      recentFuelCost,
      recentMaintCost,
      lastTrip,
      baselineFuelLitersWeek,
      baselineDistanceWeek,
      baselineFuelL100Week,
      baselineFuelStats,
      baselineFuelCostWeek,
      baselineFuelCostStats,
      baselineMaintCostWeek,
      baselineMaintCostStats,
    )
    .select({
      vehicleId: vehicles.id,
      plateNumber: vehicles.plateNumber,
      make: vehicles.make,
      model: vehicles.model,
      status: vehicles.status,
      serviceOverdue: sql<boolean>`${vehicles.lastServiceAt} is not null and now() - ${vehicles.lastServiceAt} > interval '${sql.raw(String(SERVICE_INTERVAL_MONTHS))} months'`,
      serviceDueSoon: sql<boolean>`${vehicles.lastServiceAt} is not null and now() - ${vehicles.lastServiceAt} > interval '${sql.raw(String(SERVICE_INTERVAL_MONTHS))} months' - interval '${sql.raw(String(DUE_SOON_DAYS))} days' and now() - ${vehicles.lastServiceAt} <= interval '${sql.raw(String(SERVICE_INTERVAL_MONTHS))} months'`,
      recentLiters: sql<number>`coalesce(${recentLiters.liters}, 0)`.mapWith(Number),
      recentDistance: sql<number>`coalesce(${recentDistance.distanceKm}, 0)`.mapWith(Number),
      recentFuelCost: sql<number>`coalesce(${recentFuelCost.cost}, 0)`.mapWith(Number),
      recentMaintCost: sql<number>`coalesce(${recentMaintCost.cost}, 0)`.mapWith(Number),
      lastStartedAt: lastTrip.lastStartedAt,
      baselineFuelAvg: baselineFuelStats.avgL100,
      baselineFuelStddev: baselineFuelStats.stddevL100,
      baselineFuelSamples: baselineFuelStats.samples,
      baselineFuelCostAvg: baselineFuelCostStats.avgCost,
      baselineFuelCostStddev: baselineFuelCostStats.stddevCost,
      baselineFuelCostSamples: baselineFuelCostStats.samples,
      baselineMaintCostAvg: baselineMaintCostStats.avgCost,
      baselineMaintCostStddev: baselineMaintCostStats.stddevCost,
      baselineMaintCostSamples: baselineMaintCostStats.samples,
    })
    .from(vehicles)
    .leftJoin(recentLiters, eq(recentLiters.vehicleId, vehicles.id))
    .leftJoin(recentDistance, eq(recentDistance.vehicleId, vehicles.id))
    .leftJoin(recentFuelCost, eq(recentFuelCost.vehicleId, vehicles.id))
    .leftJoin(recentMaintCost, eq(recentMaintCost.vehicleId, vehicles.id))
    .leftJoin(lastTrip, eq(lastTrip.vehicleId, vehicles.id))
    .leftJoin(baselineFuelStats, eq(baselineFuelStats.vehicleId, vehicles.id))
    .leftJoin(baselineFuelCostStats, eq(baselineFuelCostStats.vehicleId, vehicles.id))
    .leftJoin(baselineMaintCostStats, eq(baselineMaintCostStats.vehicleId, vehicles.id))
    .where(ne(vehicles.status, "retired"));
  const now = Date.now();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const items: AttentionItem[] = [];

  for (const row of rows) {
    const chips: ChipKind[] = [];

    if (row.serviceOverdue) {
      chips.push("overdue_maintenance");
    } else if (row.serviceDueSoon) {
      chips.push("maintenance_due_soon");
    }

    const lastTripAgeDays = row.lastStartedAt
      ? (now - row.lastStartedAt.getTime()) / MS_PER_DAY
      : null;
    if (lastTripAgeDays === null || lastTripAgeDays > IDLE_DAYS) {
      chips.push("idle_too_long");
    }

    const recentL100 =
      row.recentDistance > 0 ? (row.recentLiters / row.recentDistance) * 100 : null;
    if (
      recentL100 !== null &&
      row.baselineFuelSamples >= MIN_BASELINE_WEEKS &&
      row.baselineFuelStddev > 0 &&
      Math.abs(recentL100 - row.baselineFuelAvg) > SIGMA * row.baselineFuelStddev
    ) {
      chips.push("fuel_anomaly");
    }

    const recentCost = row.recentFuelCost + row.recentMaintCost;

    const haveFuel = row.baselineFuelCostSamples >= MIN_BASELINE_WEEKS;
    const haveMaint = row.baselineMaintCostSamples >= MIN_BASELINE_WEEKS;

    if (recentCost > 0 && (haveFuel || haveMaint)) {
      const weeks = RECENT_DAYS / 7;
      const avgFuel = haveFuel ? row.baselineFuelCostAvg : 0;
      const avgMaint = haveMaint ? row.baselineMaintCostAvg : 0;
      const varFuel = haveFuel ? row.baselineFuelCostStddev ** 2 : 0;
      const varMaint = haveMaint ? row.baselineMaintCostStddev ** 2 : 0;
      const expected = (avgFuel + avgMaint) * weeks;
      const expectedStddev = Math.sqrt((varFuel + varMaint) * weeks);
      if (expectedStddev > 0 && Math.abs(recentCost - expected) > SIGMA * expectedStddev) {
        chips.push("cost_anomaly");
      }
    }

    if (chips.length === 0) continue;

    items.push({
      vehicleId: row.vehicleId,
      plateNumber: row.plateNumber,
      make: row.make,
      model: row.model,
      status: row.status as "active" | "in_maintenance",
      chips,
      severityScore: chips.reduce((s, c) => s + SEVERITY[c], 0),
    });
  }

  return items.sort((a, b) => b.severityScore - a.severityScore).slice(0, TOP);
};
