export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

export const encodeCursor = (payload: unknown): string =>
  Buffer.from(JSON.stringify(payload)).toString("base64url");

export const decodeCursor = <T>(cursor: string): T =>
  JSON.parse(Buffer.from(cursor, "base64url").toString()) as T;
