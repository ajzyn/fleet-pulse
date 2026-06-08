import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents } from "@db/schema";
import { subDays } from "date-fns";
import { and, gte, isNotNull, sum } from "drizzle-orm";
import { toDayMap } from "~/lib/server/rows.server";
import { dateTruncSql, nowMinusDaysSql } from "~/lib/server/sql.server";

export interface DailyCostPoint {
  date: string;
  fuel: number;
  maintenance: number;
}

const WINDOW_DAYS = 30;

export const getDailyCost30d = async (): Promise<DailyCostPoint[]> => {
  const windowStartSql = nowMinusDaysSql(WINDOW_DAYS);
  const maintenanceEventDayExpr = dateTruncSql("day", maintenanceEvents.eventAt);
  const fuelTransactionDayExpr = dateTruncSql("day", fuelTransactions.transactionAt);

  const [dailyMaintenanceRows, dailyFuelRows] = await Promise.all([
    db
      .select({
        day: maintenanceEventDayExpr,
        totalCosts: sum(maintenanceEvents.cost).mapWith(Number),
      })
      .from(maintenanceEvents)
      .where(and(gte(maintenanceEvents.eventAt, windowStartSql), isNotNull(maintenanceEvents.cost)))
      .groupBy(maintenanceEventDayExpr),

    db
      .select({
        totalCosts: sum(fuelTransactions.cost).mapWith(Number),
        day: fuelTransactionDayExpr,
      })
      .from(fuelTransactions)
      .where(gte(fuelTransactions.transactionAt, windowStartSql))
      .groupBy(fuelTransactionDayExpr),
  ]);

  const maintenanceByDay = toDayMap(
    dailyMaintenanceRows,
    (r) => r.day,
    (r) => r.totalCosts,
  );

  const fuelByDay = toDayMap(
    dailyFuelRows,
    (r) => r.day,
    (r) => r.totalCosts,
  );

  const today = new Date();
  const result: DailyCostPoint[] = [];

  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dayISO = date.toISOString().slice(0, 10);
    const maintenanceCost = maintenanceByDay.get(dayISO) ?? 0;
    const fuelCost = fuelByDay.get(dayISO) ?? 0;

    result.push({
      date: dayISO,
      fuel: fuelCost,
      maintenance: maintenanceCost,
    });
  }

  return result;
};
