import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../../env.server";
import * as schema from "../schema";

const httpClient = neon(env.DATABASE_URL);
export const db = drizzle({ client: httpClient, schema });

export const isoDate = (d: Date): string => d.toISOString().split("T")[0] ?? "";

export const addDays = (d: Date, days: number): Date => {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
};

export const makeUniqueGenerator = (gen: () => string) => {
  const seen = new Set<string>();
  return () => {
    let value = gen();
    while (seen.has(value)) {
      value = gen();
    }
    seen.add(value);
    return value;
  };
};

const today = new Date();
const defaultPeriodEnd = new Date(
  Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
);

export const PERIOD_END = process.env.SEED_PERIOD_END
  ? new Date(process.env.SEED_PERIOD_END)
  : defaultPeriodEnd;
export const PERIOD_START = addDays(PERIOD_END, -180);

export const VEHICLE_COUNT = 150;
export const DRIVER_COUNT = 80;

export const WORKSHOPS = [
  "AutoSerwis Premium",
  "MotoMechanika",
  "Bosch Car Service",
  "Inter Cars",
  "Profi-Auto",
  "MotoExpert",
];

export const STATIONS = ["Orlen", "Shell", "BP", "Circle K", "MOL", "Lotos", "Amic Energy"];

export const FUEL_PRICE: Record<"diesel" | "petrol" | "hybrid", number> = {
  diesel: 7.2,
  petrol: 6.8,
  hybrid: 6.8,
};

export const OIL_INTERVAL = 8000;
export const TIRE_INTERVAL = 10000;
export const INSPECTION_INTERVAL = 30000;

export const BATCH_SIZE = 500;

export type Vehicle = typeof schema.vehicles.$inferSelect;
export type Driver = typeof schema.drivers.$inferSelect;

export type SeededVehicle = Pick<Vehicle, "id" | "year" | "status" | "fuelType">;
export type SeededDriver = Pick<Driver, "id" | "status">;

export interface SeededAssignment {
  vehicleId: string;
  driverId: string;
  fromDate: string;
  toDate: string | null;
}

export interface MasterData {
  vehiclesFull: SeededVehicle[];
  insertedDrivers: SeededDriver[];
  allAssignments: SeededAssignment[];
}

export interface TripsResult {
  initialMileageByVehicle: Map<string, number>;
  finalMileageByVehicle: Map<string, number>;
}
