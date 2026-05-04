import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import * as schema from "../schema";
import type { NewMaintenanceEvent } from "../schema";
import {
  addDays,
  BATCH_SIZE,
  db,
  INSPECTION_INTERVAL,
  OIL_INTERVAL,
  PERIOD_END,
  TIRE_INTERVAL,
  WORKSHOPS,
  type MasterData,
} from "./shared";

export async function seedMaintenance(input: {
  vehiclesFull: MasterData["vehiclesFull"];
  initialMileageByVehicle: Map<string, number>;
  finalMileageByVehicle: Map<string, number>;
}): Promise<void> {
  console.log("Seeding maintenance events...");

  const { vehiclesFull, initialMileageByVehicle, finalMileageByVehicle } = input;

  const maintBuffer: NewMaintenanceEvent[] = [];
  let totalMaintInserted = 0;

  const flushMaint = async (): Promise<void> => {
    while (maintBuffer.length >= BATCH_SIZE) {
      const chunk = maintBuffer.splice(0, BATCH_SIZE);
      await db.insert(schema.maintenanceEvents).values(chunk);
      totalMaintInserted += chunk.length;
    }
  };

  for (const vehicle of vehiclesFull) {
    const vehicleTrips = await db
      .select({
        endedAt: schema.trips.endedAt,
        endMileageKm: schema.trips.endMileageKm,
      })
      .from(schema.trips)
      .where(eq(schema.trips.vehicleId, vehicle.id))
      .orderBy(schema.trips.startedAt);

    if (vehicleTrips.length === 0) continue;

    const initial = initialMileageByVehicle.get(vehicle.id) ?? 0;
    let nextOilKm = initial + faker.number.int({ min: 1000, max: OIL_INTERVAL });
    let nextTireKm = initial + faker.number.int({ min: 2000, max: TIRE_INTERVAL });
    let nextInspectionKm = initial + faker.number.int({ min: 5000, max: INSPECTION_INTERVAL });

    for (const trip of vehicleTrips) {
      const m = trip.endMileageKm;
      const at = new Date(
        trip.endedAt.getTime() + faker.number.int({ min: 60, max: 240 }) * 60_000,
      );

      if (m >= nextOilKm) {
        maintBuffer.push({
          vehicleId: vehicle.id,
          eventAt: at,
          type: "oil_change",
          status: "completed",
          mileageAtEventKm: m,
          cost: faker.number.float({ min: 200, max: 500, fractionDigits: 2 }).toFixed(2),
          workshopName: faker.helpers.arrayElement(WORKSHOPS),
          notes: null,
        });
        nextOilKm =
          m +
          faker.number.int({
            min: OIL_INTERVAL - 1000,
            max: OIL_INTERVAL + 2000,
          });
      }

      if (m >= nextTireKm) {
        maintBuffer.push({
          vehicleId: vehicle.id,
          eventAt: at,
          type: "tire_rotation",
          status: "completed",
          mileageAtEventKm: m,
          cost: faker.number.float({ min: 100, max: 300, fractionDigits: 2 }).toFixed(2),
          workshopName: faker.helpers.arrayElement(WORKSHOPS),
          notes: null,
        });
        nextTireKm =
          m +
          faker.number.int({
            min: TIRE_INTERVAL - 1000,
            max: TIRE_INTERVAL + 3000,
          });
      }

      if (m >= nextInspectionKm) {
        maintBuffer.push({
          vehicleId: vehicle.id,
          eventAt: at,
          type: "inspection",
          status: "completed",
          mileageAtEventKm: m,
          cost: faker.number.float({ min: 300, max: 800, fractionDigits: 2 }).toFixed(2),
          workshopName: faker.helpers.arrayElement(WORKSHOPS),
          notes: null,
        });
        nextInspectionKm = m + faker.number.int({ min: 25000, max: 40000 });
      }
    }

    const repairCount = faker.number.int({ min: 3, max: 7 });
    for (let i = 0; i < repairCount; i++) {
      const trip = faker.helpers.arrayElement(vehicleTrips);
      maintBuffer.push({
        vehicleId: vehicle.id,
        eventAt: new Date(
          trip.endedAt.getTime() + faker.number.int({ min: 60, max: 1440 }) * 60_000,
        ),
        type: "repair",
        status: "completed",
        mileageAtEventKm: trip.endMileageKm,
        cost: faker.number.float({ min: 150, max: 2500, fractionDigits: 2 }).toFixed(2),
        workshopName: faker.helpers.arrayElement(WORKSHOPS),
        notes: null,
      });
    }

    if (faker.number.int({ min: 1, max: 100 }) <= 5) {
      const trip = faker.helpers.arrayElement(vehicleTrips);
      maintBuffer.push({
        vehicleId: vehicle.id,
        eventAt: new Date(
          trip.endedAt.getTime() + faker.number.int({ min: 60, max: 1440 }) * 60_000,
        ),
        type: "accident",
        status: "completed",
        mileageAtEventKm: trip.endMileageKm,
        cost: faker.number.float({ min: 1000, max: 8000, fractionDigits: 2 }).toFixed(2),
        workshopName: faker.helpers.arrayElement(WORKSHOPS),
        notes: faker.lorem.sentence(),
      });
    }

    if (vehicle.status !== "retired") {
      const lastMileage = finalMileageByVehicle.get(vehicle.id) ?? 0;
      const scheduledCount = faker.number.int({ min: 1, max: 3 });
      const SCHEDULED_TYPES = ["oil_change", "inspection", "tire_rotation"] as const;
      for (let i = 0; i < scheduledCount; i++) {
        maintBuffer.push({
          vehicleId: vehicle.id,
          eventAt: addDays(PERIOD_END, faker.number.int({ min: 5, max: 60 })),
          type: faker.helpers.arrayElement(SCHEDULED_TYPES),
          status: "scheduled",
          mileageAtEventKm: lastMileage + faker.number.int({ min: 500, max: 3000 }),
          cost: null,
          workshopName: null,
          notes: null,
        });
      }
    }

    await flushMaint();
  }

  if (maintBuffer.length > 0) {
    await db.insert(schema.maintenanceEvents).values(maintBuffer);
    totalMaintInserted += maintBuffer.length;
    maintBuffer.length = 0;
  }
  console.log(`Total maintenance events inserted: ${totalMaintInserted.toString()}`);
}
