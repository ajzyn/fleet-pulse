export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

export const encodeCursor = (payload: unknown): string =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

export const decodeCursor = <T>(cursor: string): T | null => {
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString()) as T;
  } catch {
    return null;
  }
};

export const decodeOffsetCursor = (cursor: string | undefined): number => {
  if (!cursor) return 0;
  const decoded = decodeCursor<{ offset: number }>(cursor);
  if (!decoded) return 0;
  return Number.isInteger(decoded.offset) && decoded.offset >= 0 ? decoded.offset : 0;
};

export const buildOffsetPage = <T>(rows: T[], offset: number, total: number): Page<T> => {
  const nextOffset = offset + rows.length;
  return {
    items: rows,
    total,
    nextCursor: nextOffset < total ? encodeCursor({ offset: nextOffset }) : null,
  };
};
