import { sql } from "drizzle-orm";

export type DeltaDirection = "up" | "down" | "flat";

export const daysAgoSql = (n: number) => sql`now() - interval '${sql.raw(n.toString())} days'`;

export const startOfDayDaysAgoSql = (n: number) =>
  sql`date_trunc('day', now()) - interval '${sql.raw(n.toString())} days'`;

export const getFirstColumnValue = <T extends Record<string, number>>(
  rows: T[],
  key: keyof T,
  fallback = 0,
): number => rows[0]?.[key] ?? fallback;

export const computeDeltaWithPercentage = (current: number, prior: number) => {
  const absolute = current - prior;
  const percentage = prior > 0 ? (absolute / prior) * 100 : 0;
  const direction: DeltaDirection =
    Math.abs(percentage) < 1 ? "flat" : absolute > 0 ? "up" : "down";
  return { absolute, percentage, direction };
};

export const buildRollingSparkline = (
  days: number,
  valueAtKey: (key: string) => number,
  today: Date = new Date(),
): number[] => {
  const sparkline: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - i);
    sparkline.push(valueAtKey(date.toISOString().slice(0, 10)));
  }
  return sparkline;
};

export const toDayMap = <T>(
  rows: T[],
  getKey: (r: T) => Date,
  getValue: (r: T) => number,
): Map<string, number> =>
  new Map(rows.map((r) => [getKey(r).toISOString().slice(0, 10), getValue(r)]));
