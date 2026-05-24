import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents } from "@db/schema";
import { getDaysInMonth } from "date-fns";
import { and, gte, isNotNull, lt, sum } from "drizzle-orm";
import { getFirstColumnValue, toDayMap } from "~/lib/server/rows.server";
import { dateTruncSql, startOfMonthMinusMonthsSql, startOfMonthSql } from "~/lib/server/sql.server";
import { computeDeltaWithPercentage, type DeltaDirection } from "./shared";

export interface MonthlySpend {
  actualMtd: number;
  forecast: number;
  threeMonthAvg: number;
  delta: { absolute: number; percentage: number; direction: DeltaDirection };
  sparkline: number[];
}

export const getMonthlySpend = async (): Promise<MonthlySpend> => {
  const currentMonthStartSql = startOfMonthSql();
  const threeMonthsAgoStartSql = startOfMonthMinusMonthsSql(3);
  const fuelTransactionDayExpr = dateTruncSql("day", fuelTransactions.transactionAt);
  const maintenanceEventDayExpr = dateTruncSql("day", maintenanceEvents.eventAt);

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
      .where(gte(fuelTransactions.transactionAt, currentMonthStartSql)),
    db
      .select({ totalCost: sum(maintenanceEvents.cost).mapWith(Number) })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, currentMonthStartSql),
          isNotNull(maintenanceEvents.cost),
        ),
      ),
    db
      .select({ totalCost: sum(fuelTransactions.cost).mapWith(Number) })
      .from(fuelTransactions)
      .where(
        and(
          gte(fuelTransactions.transactionAt, threeMonthsAgoStartSql),
          lt(fuelTransactions.transactionAt, currentMonthStartSql),
        ),
      ),
    db
      .select({ totalCost: sum(maintenanceEvents.cost).mapWith(Number) })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, threeMonthsAgoStartSql),
          lt(maintenanceEvents.eventAt, currentMonthStartSql),
          isNotNull(maintenanceEvents.cost),
        ),
      ),
    db
      .select({
        totalCost: sum(fuelTransactions.cost).mapWith(Number),
        day: fuelTransactionDayExpr,
      })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, currentMonthStartSql))
      .groupBy(fuelTransactionDayExpr),
    db
      .select({
        totalCost: sum(maintenanceEvents.cost).mapWith(Number),
        day: maintenanceEventDayExpr,
      })
      .from(maintenanceEvents)
      .where(
        and(
          gte(maintenanceEvents.eventAt, currentMonthStartSql),
          isNotNull(maintenanceEvents.cost),
        ),
      )
      .groupBy(maintenanceEventDayExpr),
  ]);

  const fuelMtd = getFirstColumnValue(fuelMtdRows, "totalCost");
  const maintenanceMtd = getFirstColumnValue(maintenanceMtdRows, "totalCost");
  const fuel3m = getFirstColumnValue(fuel3mRows, "totalCost");
  const maintenance3m = getFirstColumnValue(maintenance3mRows, "totalCost");

  const today = new Date();
  const year = today.getUTCFullYear();
  const monthIndex = today.getUTCMonth();
  const daysElapsed = today.getUTCDate();
  const daysInMonth = getDaysInMonth(today);

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
