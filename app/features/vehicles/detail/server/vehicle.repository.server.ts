import { db } from "@db/client";
import { drivers, vehicleAssignments, vehicles, type Driver, type Vehicle } from "@db/schema";
import { and, eq, isNull } from "drizzle-orm";

export interface VehicleDetail {
  vehicle: Vehicle;
  currentDriver: Driver | null;
}

export const getVehicleById = async (id: string): Promise<VehicleDetail | null> => {
  const [row] = await db
    .select({ vehicle: vehicles, driver: drivers })
    .from(vehicles)
    .leftJoin(
      vehicleAssignments,
      and(eq(vehicleAssignments.vehicleId, vehicles.id), isNull(vehicleAssignments.toDate)),
    )
    .leftJoin(drivers, eq(drivers.id, vehicleAssignments.driverId))
    .where(eq(vehicles.id, id))
    .limit(1);

  if (!row) return null;
  return { vehicle: row.vehicle, currentDriver: row.driver };
};
