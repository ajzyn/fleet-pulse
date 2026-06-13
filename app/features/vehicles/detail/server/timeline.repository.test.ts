import { describe, expect, it } from "vitest";
import { decodeCursor } from "~/lib/server/pagination";
import {
  buildTimelinePage,
  type FuelTimelineEvent,
  type MaintenanceTimelineEvent,
  type TimelineEvent,
} from "./timeline.repository.server";

const at = (iso: string) => new Date(iso);

const maint = (id: string, iso: string): MaintenanceTimelineEvent => ({
  id,
  kind: "maintenance",
  at: at(iso),
  mileageKm: 1000,
  cost: 100,
  type: "oil_change",
  status: "completed",
  workshopName: "WS",
  notes: null,
});

const fuelE = (id: string, iso: string): FuelTimelineEvent => ({
  id,
  kind: "fuel",
  at: at(iso),
  mileageKm: 1000,
  cost: 50,
  liters: 40,
  stationName: "ST",
});

const ids = (events: TimelineEvent[]) => events.map((e) => e.id);

const split = (events: TimelineEvent[]) => ({
  maintenance: events.filter((e): e is MaintenanceTimelineEvent => e.kind === "maintenance"),
  fuel: events.filter((e): e is FuelTimelineEvent => e.kind === "fuel"),
});

const decodeOrFail = <T>(cursor: string): T => {
  const decoded = decodeCursor<T>(cursor);
  if (decoded === null) throw new Error("expected a decodable cursor");
  return decoded;
};

const keysetFilter = (events: TimelineEvent[], cursor: string): TimelineEvent[] => {
  const c = decodeOrFail<{ at: string; id: string }>(cursor);
  const cAt = new Date(c.at).getTime();
  return events.filter((e) => {
    const t = e.at.getTime();
    return t < cAt || (t === cAt && e.id < c.id);
  });
};

const expectCursor = (cursor: string | null): string => {
  expect(cursor).not.toBeNull();
  if (cursor === null) throw new Error("expected a next cursor");
  return cursor;
};

describe("buildTimelinePage", () => {
  it("does not lose or duplicate rows across a page boundary spanning both tables", () => {
    const all: TimelineEvent[] = [
      maint("m5", "2026-05-05T00:00:00.000Z"),
      maint("m3", "2026-05-03T00:00:00.000Z"),
      fuelE("f4", "2026-05-04T00:00:00.000Z"),
      fuelE("f2", "2026-05-02T00:00:00.000Z"),
    ];
    const p1 = split(all);

    const page1 = buildTimelinePage(p1.maintenance, p1.fuel, 2);
    expect(ids(page1.items)).toEqual(["m5", "f4"]);
    const page2Rows = split(keysetFilter(all, expectCursor(page1.nextCursor)));
    const page2 = buildTimelinePage(page2Rows.maintenance, page2Rows.fuel, 2);
    expect(ids(page2.items)).toEqual(["m3", "f2"]);
    expect(page2.nextCursor).toBeNull();

    const seen = [...ids(page1.items), ...ids(page2.items)];
    expect(seen).toEqual(["m5", "f4", "m3", "f2"]);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("breaks ties on equal timestamps across tables without duplication", () => {
    const all: TimelineEvent[] = [
      maint("bbbb", "2026-05-05T00:00:00.000Z"),
      fuelE("aaaa", "2026-05-05T00:00:00.000Z"),
    ];
    const p1 = split(all);

    const page1 = buildTimelinePage(p1.maintenance, p1.fuel, 1);
    expect(ids(page1.items)).toEqual(["bbbb"]);
    const page2Rows = split(keysetFilter(all, expectCursor(page1.nextCursor)));
    const page2 = buildTimelinePage(page2Rows.maintenance, page2Rows.fuel, 1);
    expect(ids(page2.items)).toEqual(["aaaa"]);
    expect(page2.nextCursor).toBeNull();

    const seen = [...ids(page1.items), ...ids(page2.items)];
    expect(new Set(seen).size).toBe(seen.length);
  });

  it("has no next cursor when both tables are exhausted within the limit", () => {
    const page = buildTimelinePage(
      [maint("m3", "2026-05-03T00:00:00.000Z")],
      [fuelE("f2", "2026-05-02T00:00:00.000Z")],
      2,
    );

    expect(page.nextCursor).toBeNull();
  });

  it("signals more rows via the extra (limit + 1) probe row from a single table", () => {
    const page = buildTimelinePage(
      [
        maint("m5", "2026-05-05T00:00:00.000Z"),
        maint("m4", "2026-05-04T00:00:00.000Z"),
        maint("m3", "2026-05-03T00:00:00.000Z"),
      ],
      [],
      2,
    );

    expect(ids(page.items)).toEqual(["m5", "m4"]);
    expect(decodeOrFail<{ id: string }>(expectCursor(page.nextCursor)).id).toBe("m4");
  });
});
