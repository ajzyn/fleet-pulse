import { SQL, sql, type AnyColumn } from "drizzle-orm";

type DateTruncUnit = "day" | "hour" | "month" | "week" | "year" | "quarter";

export const nowMinusDaysSql = (n: number) => sql`now() - interval '${sql.raw(n.toString())} days'`;

export const dateTruncSql = (unit: DateTruncUnit, col: AnyColumn | SQL) =>
  sql<Date>`date_trunc(${sql.raw(`'${unit}'`)}, ${col})`.mapWith((v: string) => new Date(v));

export const startOfDayMinusDaysSql = (n: number) =>
  sql<Date>`${dateTruncSql("day", sql`now()`)} - interval '${sql.raw(n.toString())} days'`.mapWith(
    (v: string) => new Date(v),
  );

export const startOfMonthSql = () =>
  sql<Date>`${dateTruncSql("month", sql`now()`)}`.mapWith((v: string) => new Date(v));

export const startOfMonthMinusMonthsSql = (n: number) =>
  sql<Date>`${startOfMonthSql()} - interval '${sql.raw(n.toString())} months'`.mapWith(
    (v: string) => new Date(v),
  );
