import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents, trips } from "@db/schema";
import { and, gte, isNotNull, lt, sql, sum } from "drizzle-orm";
import {
  buildRollingSparkline,
  computeDeltaWithPercentage,
  daysAgoSql,
  getFirstColumnValue,
  startOfDayDaysAgoSql,
  toDayMap,
  type DeltaDirection,
} from "./shared";

export interface CostPerKm {
  value: number;
  delta: { absolute: number; percentage: number; direction: DeltaDirection };
  sparkline: number[];
}

const COST_PER_KM_WINDOW_DAYS = 30;

export const getCostPerKm = async (): Promise<CostPerKm> => {
  const currentSinceSql = daysAgoSql(COST_PER_KM_WINDOW_DAYS);
  const priorSinceSql = daysAgoSql(COST_PER_KM_WINDOW_DAYS * 2);
  const sparklineSinceSql = startOfDayDaysAgoSql(COST_PER_KM_WINDOW_DAYS - 1);

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
      .where(gte(fuelTransactions.transactionAt, currentSinceSql)),
    db
      .select({ totalCost: sum(fuelTransactions.cost).mapWith(Number) })
      .from(fuelTransactions)
      .where(
        and(
          gte(fuelTransactions.transactionAt, priorSinceSql),
          lt(fuelTransactions.transactionAt, currentSinceSql),
        ),
      ),
    db
      .select({ totalCost: sum(maintenanceEvents.cost).mapWith(Number) })
      .from(maintenanceEvents)
      .where(
        and(gte(maintenanceEvents.eventAt, currentSinceSql), isNotNull(maintenanceEvents.cost)),
      ),
    db
      .select({ totalCost: sum(maintenanceEvents.cost).mapWith(Number) })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, priorSinceSql),
          lt(maintenanceEvents.eventAt, currentSinceSql),
          isNotNull(maintenanceEvents.cost),
        ),
      ),
    db
      .select({ totalKm: sum(trips.distanceKm).mapWith(Number) })
      .from(trips)
      .where(gte(trips.startedAt, currentSinceSql)),
    db
      .select({ totalKm: sum(trips.distanceKm).mapWith(Number) })
      .from(trips)
      .where(and(gte(trips.startedAt, priorSinceSql), lt(trips.startedAt, currentSinceSql))),
    db
      .select({
        totalCost: sum(fuelTransactions.cost).mapWith(Number),
        day: sql<Date>`date_trunc('day', ${fuelTransactions.transactionAt})`,
      })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, sparklineSinceSql))
      .groupBy(sql`date_trunc('day', ${fuelTransactions.transactionAt})`),
    db
      .select({
        totalCost: sum(maintenanceEvents.cost).mapWith(Number),
        day: sql<Date>`date_trunc('day', ${maintenanceEvents.eventAt})`,
      })
      .from(maintenanceEvents)
      .where(
        and(gte(maintenanceEvents.eventAt, sparklineSinceSql), isNotNull(maintenanceEvents.cost)),
      )
      .groupBy(sql`date_trunc('day', ${maintenanceEvents.eventAt})`),
    db
      .select({
        totalKm: sum(trips.distanceKm).mapWith(Number),
        day: sql<Date>`date_trunc('day', ${trips.startedAt})`,
      })
      .from(trips)
      .where(gte(trips.startedAt, sparklineSinceSql))
      .groupBy(sql`date_trunc('day', ${trips.startedAt})`),
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
