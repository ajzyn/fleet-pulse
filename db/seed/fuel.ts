import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import * as schema from "../schema";
import type { NewFuelTransaction } from "../schema";
import { BATCH_SIZE, db, FUEL_PRICE, STATIONS, type MasterData } from "./shared";

export async function seedFuel(input: {
  vehiclesFull: MasterData["vehiclesFull"];
  initialMileageByVehicle: Map<string, number>;
}): Promise<void> {
  console.log("Seeding fuel transactions...");

  const { vehiclesFull, initialMileageByVehicle } = input;

  const fuelBuffer: NewFuelTransaction[] = [];
  let totalFuelInserted = 0;

  const flushFuel = async (): Promise<void> => {
    while (fuelBuffer.length >= BATCH_SIZE) {
      const chunk = fuelBuffer.splice(0, BATCH_SIZE);
      await db.insert(schema.fuelTransactions).values(chunk);
      totalFuelInserted += chunk.length;
    }
  };

  for (const vehicle of vehiclesFull) {
    if (vehicle.fuelType === "electric") continue;

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
    let lastFillupKm = initial - faker.number.int({ min: 100, max: 400 });
    let nextThreshold = faker.number.int({ min: 500, max: 700 });

    for (const trip of vehicleTrips) {
      if (trip.endMileageKm - lastFillupKm < nextThreshold) continue;

      const liters = faker.number.float({
        min: 40,
        max: 75,
        fractionDigits: 2,
      });
      const priceJitter = faker.number.float({
        min: 0.95,
        max: 1.05,
        fractionDigits: 3,
      });
      const pricePerLiter = FUEL_PRICE[vehicle.fuelType] * priceJitter;
      const cost = liters * pricePerLiter;

      fuelBuffer.push({
        vehicleId: vehicle.id,
        transactionAt: new Date(trip.endedAt.getTime() + 5 * 60_000),
        liters: liters.toFixed(2),
        cost: cost.toFixed(2),
        mileageAtFillupKm: trip.endMileageKm,
        stationName: faker.helpers.arrayElement(STATIONS),
      });

      lastFillupKm = trip.endMileageKm;
      nextThreshold = faker.number.int({ min: 500, max: 700 });
    }

    await flushFuel();
  }

  if (fuelBuffer.length > 0) {
    await db.insert(schema.fuelTransactions).values(fuelBuffer);
    totalFuelInserted += fuelBuffer.length;
    fuelBuffer.length = 0;
  }
  console.log(`Total fuel transactions inserted: ${totalFuelInserted.toString()}`);
}
