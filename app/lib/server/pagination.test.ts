import { describe, expect, it } from "vitest";
import { buildOffsetPage, decodeCursor, decodeOffsetCursor, encodeCursor } from "./pagination";

describe("cursor", () => {
  it("round-trips an arbitrary payload", () => {
    const payload = { at: "2026-01-15T10:00:00.000Z", id: "00000000-0000-4000-8000-000000000001" };

    expect(decodeCursor(encodeCursor(payload))).toEqual(payload);
  });

  it("encodes to a url-safe string (no +, /, =)", () => {
    const cursor = encodeCursor({ at: "2026-03-09T17:59:36.406Z", id: "ffffffff-ffff-ffff" });

    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns null for a corrupted cursor instead of throwing", () => {
    expect(decodeCursor("not-base64-json!!!")).toBeNull();
    expect(decodeCursor(Buffer.from("{broken json").toString("base64url"))).toBeNull();
  });
});

describe("decodeOffsetCursor", () => {
  it("returns 0 when the cursor is missing", () => {
    expect(decodeOffsetCursor(undefined)).toBe(0);
  });

  it("returns 0 for a garbage cursor", () => {
    expect(decodeOffsetCursor("garbage!!!")).toBe(0);
  });

  it("returns 0 for a negative offset", () => {
    expect(decodeOffsetCursor(encodeCursor({ offset: -10 }))).toBe(0);
  });

  it("returns 0 for a non-integer offset", () => {
    expect(decodeOffsetCursor(encodeCursor({ offset: 1.5 }))).toBe(0);
  });

  it("decodes a valid offset", () => {
    expect(decodeOffsetCursor(encodeCursor({ offset: 48 }))).toBe(48);
  });
});

interface Row {
  id: string;
}

const rows = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ id: String(i) }));

const expectOffset = (cursor: string | null): number => {
  expect(cursor).not.toBeNull();
  if (cursor === null) throw new Error("expected a next cursor");
  return decodeOffsetCursor(cursor);
};

describe("buildOffsetPage", () => {
  it("points the next cursor at the offset after the current page", () => {
    const page = buildOffsetPage(rows(24), 0, 100);
    expect(page.total).toBe(100);
    expect(page.items).toHaveLength(24);
    expect(expectOffset(page.nextCursor)).toBe(24);
  });

  it("advances the offset by the rows already consumed", () => {
    const page = buildOffsetPage(rows(24), 24, 100);
    expect(expectOffset(page.nextCursor)).toBe(48);
  });

  it("has no next cursor on the last partial page", () => {
    const page = buildOffsetPage(rows(4), 96, 100);
    expect(page.nextCursor).toBeNull();
  });

  it("has no next cursor when the page exactly drains the total (no phantom page)", () => {
    const page = buildOffsetPage(rows(24), 0, 24);
    expect(page.nextCursor).toBeNull();
  });

  it("has no next cursor when a filter narrows the result below one page", () => {
    const page = buildOffsetPage(rows(3), 0, 3);
    expect(page.total).toBe(3);
    expect(page.nextCursor).toBeNull();
  });

  it("returns an empty page with no cursor when nothing matches", () => {
    const page = buildOffsetPage([], 0, 0);
    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeNull();
  });
});
