import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents, trips } from "@db/schema";
import { format, startOfMonth, subMonths } from "date-fns";
import { and, eq, gte, isNotNull, max, sum } from "drizzle-orm";
import { dateTruncSql, startOfMonthMinusMonthsSql } from "~/lib/server/sql.server";

export interface VehicleMonthlyStatsPoint {
  month: string;
  fuelCost: number;
  maintenanceCost: number;
  liters: number;
  distanceKm: number;
  odometerKm: number | null;
}

const MONTHS_IN_WINDOW = 12;
const MONTH_KEY_FORMAT = "yyyy-MM";

const maxNullable = (a: number | undefined, b: number | undefined): number | null => {
  const present = [a, b].filter((v): v is number => typeof v === "number");
  return present.length > 0 ? Math.max(...present) : null;
};

export const getVehicleMonthlyStats = async (
  vehicleId: string,
): Promise<VehicleMonthlyStatsPoint[]> => {
  const windowStartSql = startOfMonthMinusMonthsSql(MONTHS_IN_WINDOW - 1);
  const fuelMonthExpr = dateTruncSql("month", fuelTransactions.transactionAt);
  const maintenanceMonthExpr = dateTruncSql("month", maintenanceEvents.eventAt);
  const tripMonthExpr = dateTruncSql("month", trips.startedAt);

  const [fuelRows, maintenanceRows, tripRows] = await Promise.all([
    db
      .select({
        month: fuelMonthExpr,
        cost: sum(fuelTransactions.cost).mapWith(Number),
        liters: sum(fuelTransactions.liters).mapWith(Number),
        odometer: max(fuelTransactions.mileageAtFillupKm).mapWith(Number),
      })
      .from(fuelTransactions)
      .where(
        and(
          eq(fuelTransactions.vehicleId, vehicleId),
          gte(fuelTransactions.transactionAt, windowStartSql),
        ),
      )
      .groupBy(fuelMonthExpr),

    db
      .select({
        month: maintenanceMonthExpr,
        cost: sum(maintenanceEvents.cost).mapWith(Number),
      })
      .from(maintenanceEvents)
      .where(
        and(
          eq(maintenanceEvents.vehicleId, vehicleId),
          gte(maintenanceEvents.eventAt, windowStartSql),
          isNotNull(maintenanceEvents.cost),
        ),
      )
      .groupBy(maintenanceMonthExpr),

    db
      .select({
        month: tripMonthExpr,
        distance: sum(trips.distanceKm).mapWith(Number),
        odometer: max(trips.endMileageKm).mapWith(Number),
      })
      .from(trips)
      .where(and(eq(trips.vehicleId, vehicleId), gte(trips.startedAt, windowStartSql)))
      .groupBy(tripMonthExpr),
  ]);

  const fuelCostByMonth = new Map(fuelRows.map((r) => [format(r.month, MONTH_KEY_FORMAT), r.cost]));
  const litersByMonth = new Map(fuelRows.map((r) => [format(r.month, MONTH_KEY_FORMAT), r.liters]));
  const fuelOdometerByMonth = new Map(
    fuelRows.map((r) => [format(r.month, MONTH_KEY_FORMAT), r.odometer]),
  );
  const maintenanceByMonth = new Map(
    maintenanceRows.map((r) => [format(r.month, MONTH_KEY_FORMAT), r.cost]),
  );
  const distanceByMonth = new Map(
    tripRows.map((r) => [format(r.month, MONTH_KEY_FORMAT), r.distance]),
  );
  const tripOdometerByMonth = new Map(
    tripRows.map((r) => [format(r.month, MONTH_KEY_FORMAT), r.odometer]),
  );

  const today = new Date();
  const result: VehicleMonthlyStatsPoint[] = [];

  for (let i = MONTHS_IN_WINDOW - 1; i >= 0; i--) {
    const monthDate = startOfMonth(subMonths(today, i));
    const monthKey = format(monthDate, MONTH_KEY_FORMAT);

    result.push({
      month: monthKey,
      fuelCost: fuelCostByMonth.get(monthKey) ?? 0,
      maintenanceCost: maintenanceByMonth.get(monthKey) ?? 0,
      liters: litersByMonth.get(monthKey) ?? 0,
      distanceKm: distanceByMonth.get(monthKey) ?? 0,
      odometerKm: maxNullable(fuelOdometerByMonth.get(monthKey), tripOdometerByMonth.get(monthKey)),
    });
  }

  return result;
};
