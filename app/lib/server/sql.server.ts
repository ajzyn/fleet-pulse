import { SQL, sql, type AnyColumn } from "drizzle-orm";

type DateTruncUnit = "day" | "hour" | "month" | "week" | "year" | "quarter";

export const nowMinusDaysSql = (n: number) => sql`now() - interval '${sql.raw(n.toString())} days'`;

export const dateTruncSql = (unit: DateTruncUnit, col: AnyColumn | SQL) =>
  sql<Date>`date_trunc(${unit}, ${col})`;

export const startOfDayMinusDaysSql = (n: number) =>
  sql<Date>`${dateTruncSql("day", sql`now()`)} - interval '${sql.raw(n.toString())} days'`;

export const startOfMonthSql = () => sql<Date>`${dateTruncSql("month", sql`now()`)}`;

export const startOfMonthMinusMonthsSql = (n: number) =>
  sql<Date>`${startOfMonthSql()} - interval '${sql.raw(n.toString())} months'`;
