import { db } from "@db/client";
import { trips, vehicles } from "@db/schema";
import { and, count, eq, gte, lt, sum } from "drizzle-orm";
import { getFirstColumnValue, toDayMap } from "~/lib/server/rows.server";
import { dateTruncSql, nowMinusDaysSql, startOfDayMinusDaysSql } from "~/lib/server/sql.server";
import { buildRollingSparkline, computeDeltaWithPercentage, type DeltaDirection } from "./shared";

export interface Utilization {
  kmPerDay: number;
  delta: { absolute: number; percentage: number; direction: DeltaDirection };
  sparkline: number[];
}

const UTILIZATION_WINDOW_DAYS = 30;

export const getUtilization = async (): Promise<Utilization> => {
  const currentWindowStartSql = nowMinusDaysSql(UTILIZATION_WINDOW_DAYS);
  const priorWindowStartSql = nowMinusDaysSql(UTILIZATION_WINDOW_DAYS * 2);
  const sparklineWindowStartSql = startOfDayMinusDaysSql(UTILIZATION_WINDOW_DAYS - 1);
  const tripStartedDayExpr = dateTruncSql("day", trips.startedAt);

  const [currentKmRows, priorKmRows, activeVehicleRows, sparklineRows] = await Promise.all([
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
    db.select({ count: count() }).from(vehicles).where(eq(vehicles.status, "active")),
    db
      .select({
        day: tripStartedDayExpr,
        totalKm: sum(trips.distanceKm).mapWith(Number),
      })
      .from(trips)
      .where(gte(trips.startedAt, sparklineWindowStartSql))
      .groupBy(tripStartedDayExpr),
  ]);

  const currentKm = getFirstColumnValue(currentKmRows, "totalKm");
  const priorKm = getFirstColumnValue(priorKmRows, "totalKm");
  const activeVehicleCount = getFirstColumnValue(activeVehicleRows, "count");

  const kmPerDay =
    activeVehicleCount > 0 ? currentKm / activeVehicleCount / UTILIZATION_WINDOW_DAYS : 0;
  const priorKmPerDay =
    activeVehicleCount > 0 ? priorKm / activeVehicleCount / UTILIZATION_WINDOW_DAYS : 0;

  const delta = computeDeltaWithPercentage(kmPerDay, priorKmPerDay);

  const kmByDay = toDayMap(
    sparklineRows,
    (r) => r.day,
    (r) => r.totalKm,
  );
  const sparkline = buildRollingSparkline(UTILIZATION_WINDOW_DAYS, (key) => {
    const km = kmByDay.get(key) ?? 0;
    return activeVehicleCount > 0 ? km / activeVehicleCount : 0;
  });

  return { kmPerDay, delta, sparkline };
};
