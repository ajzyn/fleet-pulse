import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./pagination";

describe("cursor", () => {
  it("round-trips an arbitrary payload", () => {
    const payload = { at: "2026-01-15T10:00:00.000Z", id: "00000000-0000-4000-8000-000000000001" };

    expect(decodeCursor(encodeCursor(payload))).toEqual(payload);
  });

  it("encodes to a url-safe string (no +, /, =)", () => {
    const cursor = encodeCursor({ at: "2026-03-09T17:59:36.406Z", id: "ffffffff-ffff-ffff" });

    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
