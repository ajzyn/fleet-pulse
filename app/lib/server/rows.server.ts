export const toDayMap = <T>(
  rows: T[],
  getKey: (r: T) => Date,
  getValue: (r: T) => number,
): Map<string, number> =>
  new Map(rows.map((r) => [getKey(r).toISOString().slice(0, 10), getValue(r)]));

export const getFirstColumnValue = <T extends Record<string, number>>(
  rows: T[],
  key: keyof T,
  fallback = 0,
): number => rows[0]?.[key] ?? fallback;
