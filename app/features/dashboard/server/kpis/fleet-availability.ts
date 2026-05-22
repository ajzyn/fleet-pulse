import { db } from "@db/client";
import { trips, vehicles } from "@db/schema";
import { and, countDistinct, gte, lt, ne } from "drizzle-orm";
import { getFirstColumnValue, toDayMap } from "~/lib/server/rows.server";
import { dateTruncSql, nowMinusDaysSql, startOfDayMinusDaysSql } from "~/lib/server/sql.server";
import { buildRollingSparkline, type DeltaDirection } from "./shared";

export interface FleetAvailability {
  activeNow: number;
  totalNonRetired: number;
  delta: { absolute: number; direction: DeltaDirection };
  sparkline: number[];
}

const SPARKLINE_DAYS = 14;
const WEEK_DAYS = 7;

export const getFleetAvailability = async (): Promise<FleetAvailability> => {
  const currentWindowStartSql = nowMinusDaysSql(WEEK_DAYS);
  const priorWindowStartSql = nowMinusDaysSql(WEEK_DAYS * 2);
  const sparklineWindowStartSql = startOfDayMinusDaysSql(SPARKLINE_DAYS);
  const tripStartedDayExpr = dateTruncSql("day", trips.startedAt);

  const [activeNowRows, activePriorRows, totalRows, sparklineRows] = await Promise.all([
    db
      .select({ count: countDistinct(trips.vehicleId).mapWith(Number) })
      .from(trips)
      .where(gte(trips.startedAt, currentWindowStartSql)),
    db
      .select({ count: countDistinct(trips.vehicleId).mapWith(Number) })
      .from(trips)
      .where(
        and(gte(trips.startedAt, priorWindowStartSql), lt(trips.startedAt, currentWindowStartSql)),
      ),
    db
      .select({ count: countDistinct(vehicles.id).mapWith(Number) })
      .from(vehicles)
      .where(ne(vehicles.status, "retired")),
    db
      .select({
        count: countDistinct(trips.vehicleId).mapWith(Number),
        day: tripStartedDayExpr,
      })
      .from(trips)
      .where(gte(trips.startedAt, sparklineWindowStartSql))
      .groupBy(tripStartedDayExpr),
  ]);

  const activeNow = getFirstColumnValue(activeNowRows, "count");
  const activePrior = getFirstColumnValue(activePriorRows, "count");
  const totalNonRetired = getFirstColumnValue(totalRows, "count");

  const delta = computeDeltaAbsolute(activeNow, activePrior);
  const vehiclesByDay = toDayMap(
    sparklineRows,
    (r) => r.day,
    (r) => r.count,
  );
  const sparkline = buildRollingSparkline(SPARKLINE_DAYS, (key) => vehiclesByDay.get(key) ?? 0);

  return { activeNow, totalNonRetired, delta, sparkline };
};

const computeDeltaAbsolute = (current: number, prior: number) => {
  const absolute = current - prior;
  const direction: DeltaDirection = absolute > 0 ? "up" : absolute < 0 ? "down" : "flat";
  return { absolute, direction };
};
