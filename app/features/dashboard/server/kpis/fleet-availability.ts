import { db } from "@db/client";
import { trips, vehicles } from "@db/schema";
import { and, countDistinct, gte, lt, ne, sql } from "drizzle-orm";
import {
  buildRollingSparkline,
  daysAgoSql,
  getFirstColumnValue,
  startOfDayDaysAgoSql,
  toDayMap,
  type DeltaDirection,
} from "./shared";

export interface FleetAvailability {
  activeNow: number;
  totalNonRetired: number;
  delta: { absolute: number; direction: DeltaDirection };
  sparkline: number[];
}

const SPARKLINE_DAYS = 14;
const WEEK_DAYS = 7;

export const getFleetAvailability = async (): Promise<FleetAvailability> => {
  const currentWeekSinceSql = daysAgoSql(WEEK_DAYS);
  const priorWeekSinceSql = daysAgoSql(WEEK_DAYS * 2);
  const sparklineSinceSql = startOfDayDaysAgoSql(SPARKLINE_DAYS);

  const [activeNowRows, activePriorRows, totalRows, sparklineRows] = await Promise.all([
    db
      .select({ count: countDistinct(trips.vehicleId).mapWith(Number) })
      .from(trips)
      .where(gte(trips.startedAt, currentWeekSinceSql)),
    db
      .select({ count: countDistinct(trips.vehicleId).mapWith(Number) })
      .from(trips)
      .where(
        and(gte(trips.startedAt, priorWeekSinceSql), lt(trips.startedAt, currentWeekSinceSql)),
      ),
    db
      .select({ count: countDistinct(vehicles.id).mapWith(Number) })
      .from(vehicles)
      .where(ne(vehicles.status, "retired")),
    db
      .select({
        count: countDistinct(trips.vehicleId).mapWith(Number),
        day: sql<Date>`date_trunc('day', ${trips.startedAt})`,
      })
      .from(trips)
      .where(gte(trips.startedAt, sparklineSinceSql))
      .groupBy(sql`date_trunc('day', ${trips.startedAt})`),
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
