import { db } from "@db/client";
import { fuelTransactions, maintenanceEvents, type MaintenanceEvent } from "@db/schema";
import { count, desc, eq } from "drizzle-orm";

const LIMIT = 25;

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

export interface VehicleTimeline {
  events: TimelineEvent[];
  total: number;
}

export const getVehicleTimeline = async (vehicleId: string): Promise<VehicleTimeline> => {
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
      .where(eq(maintenanceEvents.vehicleId, vehicleId))
      .orderBy(desc(maintenanceEvents.eventAt))
      .limit(LIMIT),
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
      .where(eq(fuelTransactions.vehicleId, vehicleId))
      .orderBy(desc(fuelTransactions.transactionAt))
      .limit(LIMIT),
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

  const events = [...maintenance, ...fuel]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, LIMIT);

  return {
    events,
    total: (maintenanceTotal[0]?.value ?? 0) + (fuelTotal[0]?.value ?? 0),
  };
};
