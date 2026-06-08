import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents, trips } from "@db/schema";
import { and, gte, isNotNull, lt, sum } from "drizzle-orm";
import { getFirstColumnValue, toDayMap } from "~/lib/server/rows.server";
import { dateTruncSql, nowMinusDaysSql, startOfDayMinusDaysSql } from "~/lib/server/sql.server";
import { buildRollingSparkline, computeDeltaWithPercentage, type DeltaDirection } from "./shared";

export interface CostPerKm {
  value: number;
  delta: { absolute: number; percentage: number; direction: DeltaDirection };
  sparkline: number[];
}

const COST_PER_KM_WINDOW_DAYS = 30;

export const getCostPerKm = async (): Promise<CostPerKm> => {
  const currentWindowStartSql = nowMinusDaysSql(COST_PER_KM_WINDOW_DAYS);
  const priorWindowStartSql = nowMinusDaysSql(COST_PER_KM_WINDOW_DAYS * 2);
  const sparklineWindowStartSql = startOfDayMinusDaysSql(COST_PER_KM_WINDOW_DAYS - 1);
  const fuelTransactionDayExpr = dateTruncSql("day", fuelTransactions.transactionAt);
  const maintenanceEventDayExpr = dateTruncSql("day", maintenanceEvents.eventAt);
  const tripStartedDayExpr = dateTruncSql("day", trips.startedAt);

  const [
    currentFuelRows,
    priorFuelRows,
    currentMaintenanceRows,
    priorMaintenanceRows,
    currentKmRows,
    priorKmRows,
    dailyFuelRows,
    dailyMaintenanceRows,
    dailyKmRows,
  ] = await Promise.all([
    db
      .select({ totalCost: sum(fuelTransactions.cost).mapWith(Number) })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, currentWindowStartSql)),
    db
      .select({ totalCost: sum(fuelTransactions.cost).mapWith(Number) })
      .from(fuelTransactions)
      .where(
        and(
          gte(fuelTransactions.transactionAt, priorWindowStartSql),
          lt(fuelTransactions.transactionAt, currentWindowStartSql),
        ),
      ),
    db
      .select({ totalCost: sum(maintenanceEvents.cost).mapWith(Number) })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, currentWindowStartSql),
          isNotNull(maintenanceEvents.cost),
        ),
      ),
    db
      .select({ totalCost: sum(maintenanceEvents.cost).mapWith(Number) })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, priorWindowStartSql),
          lt(maintenanceEvents.eventAt, currentWindowStartSql),
          isNotNull(maintenanceEvents.cost),
        ),
      ),
    db
      .select({ totalKm: sum(trips.distanceKm).mapWith(Number) })
      .from(trips)
      .where(gte(trips.startedAt, currentWindowStartSql)),
    db
      .select({ totalKm: sum(trips.distanceKm).mapWith(Number) })
      .from(trips)
      .where(
        and(gte(trips.startedAt, priorWindowStartSql), lt(trips.startedAt, currentWindowStartSql)),
      ),
    db
      .select({
        totalCost: sum(fuelTransactions.cost).mapWith(Number),
        day: fuelTransactionDayExpr,
      })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, sparklineWindowStartSql))
      .groupBy(fuelTransactionDayExpr),
    db
      .select({
        totalCost: sum(maintenanceEvents.cost).mapWith(Number),
        day: maintenanceEventDayExpr,
      })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, sparklineWindowStartSql),
          isNotNull(maintenanceEvents.cost),
        ),
      )
      .groupBy(maintenanceEventDayExpr),
    db
      .select({
        totalKm: sum(trips.distanceKm).mapWith(Number),
        day: tripStartedDayExpr,
      })
      .from(trips)
      .where(gte(trips.startedAt, sparklineWindowStartSql))
      .groupBy(tripStartedDayExpr),
  ]);

  const currentKm = getFirstColumnValue(currentKmRows, "totalKm");
  const currentFuelCost = getFirstColumnValue(currentFuelRows, "totalCost");
  const currentMaintenanceCost = getFirstColumnValue(currentMaintenanceRows, "totalCost");
  const priorKm = getFirstColumnValue(priorKmRows, "totalKm");
  const priorFuelCost = getFirstColumnValue(priorFuelRows, "totalCost");
  const priorMaintenanceCost = getFirstColumnValue(priorMaintenanceRows, "totalCost");

  const value = currentKm > 0 ? (currentFuelCost + currentMaintenanceCost) / currentKm : 0;
  const priorValue = priorKm > 0 ? (priorFuelCost + priorMaintenanceCost) / priorKm : 0;

  const delta = computeDeltaWithPercentage(value, priorValue);

  const fuelCostByDay = toDayMap(
    dailyFuelRows,
    (r) => r.day,
    (r) => r.totalCost,
  );
  const maintenanceCostByDay = toDayMap(
    dailyMaintenanceRows,
    (r) => r.day,
    (r) => r.totalCost,
  );
  const kmByDay = toDayMap(
    dailyKmRows,
    (r) => r.day,
    (r) => r.totalKm,
  );

  const sparkline = buildRollingSparkline(COST_PER_KM_WINDOW_DAYS, (key) => {
    const fuelCost = fuelCostByDay.get(key) ?? 0;
    const maintenanceCost = maintenanceCostByDay.get(key) ?? 0;
    const km = kmByDay.get(key) ?? 0;
    return km > 0 ? (fuelCost + maintenanceCost) / km : 0;
  });

  return { value, delta, sparkline };
};
