import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents } from "@db/schema";
import { and, gte, isNotNull, lt, sql, sum } from "drizzle-orm";
import {
  computeDeltaWithPercentage,
  getFirstColumnValue,
  toDayMap,
  type DeltaDirection,
} from "./shared";

export interface MonthlySpend {
  actualMtd: number;
  forecast: number;
  threeMonthAvg: number;
  delta: { absolute: number; percentage: number; direction: DeltaDirection };
  sparkline: number[];
}

export const getMonthlySpend = async (): Promise<MonthlySpend> => {
  const currentMonthSinceSql = sql`date_trunc('month', now())`;
  const last3MonthsSinceSql = sql`date_trunc('month', now()) - interval '3 months'`;

  const [
    fuelMtdRows,
    maintenanceMtdRows,
    fuel3mRows,
    maintenance3mRows,
    dailyFuelRows,
    dailyMaintenanceRows,
  ] = await Promise.all([
    db
      .select({ totalCost: sum(fuelTransactions.cost).mapWith(Number) })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, currentMonthSinceSql)),
    db
      .select({ totalCost: sum(maintenanceEvents.cost).mapWith(Number) })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, currentMonthSinceSql),
          isNotNull(maintenanceEvents.cost),
        ),
      ),
    db
      .select({ totalCost: sum(fuelTransactions.cost).mapWith(Number) })
      .from(fuelTransactions)
      .where(
        and(
          gte(fuelTransactions.transactionAt, last3MonthsSinceSql),
          lt(fuelTransactions.transactionAt, currentMonthSinceSql),
        ),
      ),
    db
      .select({ totalCost: sum(maintenanceEvents.cost).mapWith(Number) })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, last3MonthsSinceSql),
          lt(maintenanceEvents.eventAt, currentMonthSinceSql),
          isNotNull(maintenanceEvents.cost),
        ),
      ),
    db
      .select({
        totalCost: sum(fuelTransactions.cost).mapWith(Number),
        day: sql<Date>`date_trunc('day', ${fuelTransactions.transactionAt})`,
      })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, currentMonthSinceSql))
      .groupBy(sql`date_trunc('day', ${fuelTransactions.transactionAt})`),
    db
      .select({
        totalCost: sum(maintenanceEvents.cost).mapWith(Number),
        day: sql<Date>`date_trunc('day', ${maintenanceEvents.eventAt})`,
      })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, currentMonthSinceSql),
          isNotNull(maintenanceEvents.cost),
        ),
      )
      .groupBy(sql`date_trunc('day', ${maintenanceEvents.eventAt})`),
  ]);

  const fuelMtd = getFirstColumnValue(fuelMtdRows, "totalCost");
  const maintenanceMtd = getFirstColumnValue(maintenanceMtdRows, "totalCost");
  const fuel3m = getFirstColumnValue(fuel3mRows, "totalCost");
  const maintenance3m = getFirstColumnValue(maintenance3mRows, "totalCost");

  const today = new Date();
  const year = today.getUTCFullYear();
  const monthIndex = today.getUTCMonth();
  const daysElapsed = today.getUTCDate();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const actualMtd = fuelMtd + maintenanceMtd;
  const threeMonthAvg = (fuel3m + maintenance3m) / 3;
  const forecast = daysElapsed > 0 ? (actualMtd / daysElapsed) * daysInMonth : 0;

  const delta = computeDeltaWithPercentage(forecast, threeMonthAvg);

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

  const sparkline: number[] = [];
  let cumulativeCost = 0;
  for (let day = 1; day <= daysElapsed; day++) {
    const key = new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
    cumulativeCost += (fuelCostByDay.get(key) ?? 0) + (maintenanceCostByDay.get(key) ?? 0);
    sparkline.push(cumulativeCost);
  }

  return { actualMtd, forecast, threeMonthAvg, delta, sparkline };
};
