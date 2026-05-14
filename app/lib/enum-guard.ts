export function createEnumGuard<T extends string>(values: T[]) {
  const set = new Set<string>(values);
  return (v: unknown): v is T => typeof v === "string" && set.has(v);
}
