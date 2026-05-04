import { faker } from "@faker-js/faker";
import "dotenv/config";
import * as schema from "./schema";
import { injectAnomalies } from "./seed/anomalies";
import { finalize } from "./seed/finalize";
import { seedFuel } from "./seed/fuel";
import { seedMaintenance } from "./seed/maintenance";
import { seedMasterData } from "./seed/master";
import { db } from "./seed/shared";
import { seedTrips } from "./seed/trips";

faker.seed(42);

async function main() {
  console.log("Clearing existing data...");
  await db.delete(schema.maintenanceEvents);
  await db.delete(schema.fuelTransactions);
  await db.delete(schema.trips);
  await db.delete(schema.vehicleAssignments);
  await db.delete(schema.drivers);
  await db.delete(schema.vehicles);

  const master = await seedMasterData();
  const trips = await seedTrips(master);
  await seedFuel({
    vehiclesFull: master.vehiclesFull,
    initialMileageByVehicle: trips.initialMileageByVehicle,
  });
  await seedMaintenance({
    vehiclesFull: master.vehiclesFull,
    initialMileageByVehicle: trips.initialMileageByVehicle,
    finalMileageByVehicle: trips.finalMileageByVehicle,
  });
  await injectAnomalies({
    vehiclesFull: master.vehiclesFull,
    insertedDrivers: master.insertedDrivers,
    allAssignments: master.allAssignments,
    finalMileageByVehicle: trips.finalMileageByVehicle,
  });
  await finalize();

  console.log("All stages done");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
