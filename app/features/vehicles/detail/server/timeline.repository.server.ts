import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents, type MaintenanceEvent } from "@db/schema";
import { and, count, desc, eq, lt, or } from "drizzle-orm";
import { decodeCursor, encodeCursor, type Page } from "~/lib/server/pagination";

const PAGE_SIZE = 25;

export interface MaintenanceTimelineEvent {
  id: string;
  kind: "maintenance";
  at: Date;
  mileageKm: number;
  cost: number | null;
  type: MaintenanceEvent["type"];
  status: MaintenanceEvent["status"];
  workshopName: string | null;
  notes: string | null;
}

export interface FuelTimelineEvent {
  id: string;
  kind: "fuel";
  at: Date;
  mileageKm: number;
  cost: number;
  liters: number;
  stationName: string;
}

export type TimelineEvent = MaintenanceTimelineEvent | FuelTimelineEvent;

interface TimelineCursor {
  at: Date;
  id: string;
}

const byAtIdDesc = (a: TimelineEvent, b: TimelineEvent): number => {
  const delta = b.at.getTime() - a.at.getTime();
  if (delta !== 0) return delta;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
};

export const buildTimelinePage = (
  maintenance: MaintenanceTimelineEvent[],
  fuel: FuelTimelineEvent[],
  limit: number,
): Pick<Page<TimelineEvent>, "items" | "nextCursor"> => {
  const moreInTable = maintenance.length > limit || fuel.length > limit;
  const candidates = [...maintenance.slice(0, limit), ...fuel.slice(0, limit)].sort(byAtIdDesc);
  const hasMore = candidates.length > limit || moreInTable;
  const items = candidates.slice(0, limit);
  const last = items[items.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ at: last.at.toISOString(), id: last.id }) : null;

  return { items, nextCursor };
};

const decodeTimelineCursor = (cursor: string): TimelineCursor => {
  const raw = decodeCursor<{ at: string; id: string }>(cursor);
  return { at: new Date(raw.at), id: raw.id };
};

export const getVehicleTimeline = async (
  vehicleId: string,
  opts: { cursor?: string; limit?: number } = {},
): Promise<Page<TimelineEvent>> => {
  const limit = opts.limit ?? PAGE_SIZE;
  const cursor = opts.cursor ? decodeTimelineCursor(opts.cursor) : undefined;

  const maintenanceCursor = cursor
    ? or(
        lt(maintenanceEvents.eventAt, cursor.at),
        and(eq(maintenanceEvents.eventAt, cursor.at), lt(maintenanceEvents.id, cursor.id)),
      )
    : undefined;

  const fuelCursor = cursor
    ? or(
        lt(fuelTransactions.transactionAt, cursor.at),
        and(eq(fuelTransactions.transactionAt, cursor.at), lt(fuelTransactions.id, cursor.id)),
      )
    : undefined;

  const [maintenanceRows, fuelRows, maintenanceTotal, fuelTotal] = await Promise.all([
    db
      .select({
        id: maintenanceEvents.id,
        at: maintenanceEvents.eventAt,
        type: maintenanceEvents.type,
        status: maintenanceEvents.status,
        mileageKm: maintenanceEvents.mileageAtEventKm,
        cost: maintenanceEvents.cost,
        workshopName: maintenanceEvents.workshopName,
        notes: maintenanceEvents.notes,
      })
      .from(maintenanceEvents)
      .where(and(eq(maintenanceEvents.vehicleId, vehicleId), maintenanceCursor))
      .orderBy(desc(maintenanceEvents.eventAt), desc(maintenanceEvents.id))
      .limit(limit + 1),
    db
      .select({
        id: fuelTransactions.id,
        at: fuelTransactions.transactionAt,
        liters: fuelTransactions.liters,
        cost: fuelTransactions.cost,
        mileageKm: fuelTransactions.mileageAtFillupKm,
        stationName: fuelTransactions.stationName,
      })
      .from(fuelTransactions)
      .where(and(eq(fuelTransactions.vehicleId, vehicleId), fuelCursor))
      .orderBy(desc(fuelTransactions.transactionAt), desc(fuelTransactions.id))
      .limit(limit + 1),
    db
      .select({ value: count() })
      .from(maintenanceEvents)
      .where(eq(maintenanceEvents.vehicleId, vehicleId)),
    db
      .select({ value: count() })
      .from(fuelTransactions)
      .where(eq(fuelTransactions.vehicleId, vehicleId)),
  ]);

  const maintenance: MaintenanceTimelineEvent[] = maintenanceRows.map((row) => ({
    id: row.id,
    kind: "maintenance",
    at: row.at,
    mileageKm: row.mileageKm,
    cost: row.cost === null ? null : Number(row.cost),
    type: row.type,
    status: row.status,
    workshopName: row.workshopName,
    notes: row.notes,
  }));

  const fuel: FuelTimelineEvent[] = fuelRows.map((row) => ({
    id: row.id,
    kind: "fuel",
    at: row.at,
    mileageKm: row.mileageKm,
    cost: Number(row.cost),
    liters: Number(row.liters),
    stationName: row.stationName,
  }));

  return {
    ...buildTimelinePage(maintenance, fuel, limit),
    total: (maintenanceTotal[0]?.value ?? 0) + (fuelTotal[0]?.value ?? 0),
  };
};
