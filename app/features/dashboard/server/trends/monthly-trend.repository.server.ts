import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents, trips, vehicles } from "@db/schema";
import { format, getDaysInMonth, startOfMonth, subMonths } from "date-fns";
import { and, gte, isNotNull, ne, sum } from "drizzle-orm";
import { dateTruncSql, startOfMonthMinusMonthsSql } from "~/lib/server/sql.server";

export interface MonthlyTrendPoint {
  month: string;
  fuel: number;
  maintenance: number;
  activeVehicleCountInMonth: number;
  utilizationKmPerDay: number;
}

const MONTHS_IN_WINDOW = 12;
const MONTH_KEY_FORMAT = "yyyy-MM";

export const getMonthlyTrend12m = async (): Promise<MonthlyTrendPoint[]> => {
  const windowStartSql = startOfMonthMinusMonthsSql(MONTHS_IN_WINDOW - 1);
  const fuelTransactionMonthExpr = dateTruncSql("month", fuelTransactions.transactionAt);
  const maintenanceEventMonthExpr = dateTruncSql("month", maintenanceEvents.eventAt);
  const tripStartedMonthExpr = dateTruncSql("month", trips.startedAt);

  const [fuelMonthlyRows, maintenanceMonthlyRows, tripMonthlyRows, activeVehiclesRows] =
    await Promise.all([
      db
        .select({
          month: fuelTransactionMonthExpr,
          totalCost: sum(fuelTransactions.cost).mapWith(Number),
        })
        .from(fuelTransactions)
        .where(gte(fuelTransactions.transactionAt, windowStartSql))
        .groupBy(fuelTransactionMonthExpr),

      db
        .select({
          month: maintenanceEventMonthExpr,
          totalCost: sum(maintenanceEvents.cost).mapWith(Number),
        })
        .from(maintenanceEvents)
        .where(
          and(gte(maintenanceEvents.eventAt, windowStartSql), isNotNull(maintenanceEvents.cost)),
        )
        .groupBy(maintenanceEventMonthExpr),
      db
        .select({
          totalKm: sum(trips.distanceKm).mapWith(Number),
          month: tripStartedMonthExpr,
        })
        .from(trips)
        .where(gte(trips.startedAt, windowStartSql))
        .groupBy(tripStartedMonthExpr),
      db
        .select({
          purchaseDate: vehicles.purchaseDate,
        })
        .from(vehicles)
        .where(ne(vehicles.status, "retired")),
    ]);

  const fuelByMonth = new Map(
    fuelMonthlyRows.map((r) => [format(r.month, MONTH_KEY_FORMAT), r.totalCost]),
  );

  const maintenanceByMonth = new Map(
    maintenanceMonthlyRows.map((r) => [format(r.month, MONTH_KEY_FORMAT), r.totalCost]),
  );

  const kmByMonth = new Map(
    tripMonthlyRows.map((r) => [format(r.month, MONTH_KEY_FORMAT), r.totalKm]),
  );

  const today = new Date();
  const result: MonthlyTrendPoint[] = [];
  for (let i = MONTHS_IN_WINDOW - 1; i >= 0; i--) {
    const monthDate = startOfMonth(subMonths(today, i));
    const daysInMonth = getDaysInMonth(monthDate);
    const monthKey = format(monthDate, MONTH_KEY_FORMAT);

    const fuel = fuelByMonth.get(monthKey) ?? 0;
    const maintenance = maintenanceByMonth.get(monthKey) ?? 0;
    const km = kmByMonth.get(monthKey) ?? 0;

    const activeVehicleCountInMonth = activeVehiclesRows.filter(
      (v) => v.purchaseDate.slice(0, 7) <= monthKey,
    ).length;

    const utilizationKmPerDay =
      activeVehicleCountInMonth > 0 ? km / daysInMonth / activeVehicleCountInMonth : 0;

    result.push({
      month: monthKey,
      fuel,
      maintenance,
      activeVehicleCountInMonth,
      utilizationKmPerDay,
    });
  }

  return result;
};
