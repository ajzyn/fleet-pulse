import { faker } from "@faker-js/faker";
import * as schema from "../schema";
import type { NewTrip } from "../schema";
import {
  addDays,
  BATCH_SIZE,
  db,
  PERIOD_END,
  PERIOD_START,
  type MasterData,
  type TripsResult,
} from "./shared";

export async function seedTrips(input: {
  vehiclesFull: MasterData["vehiclesFull"];
  allAssignments: MasterData["allAssignments"];
}): Promise<TripsResult> {
  console.log("Seeding trips timeline...");

  const { vehiclesFull, allAssignments } = input;

  const assignmentsByVehicle = new Map<
    string,
    { driverId: string; fromMs: number; toMs: number }[]
  >();
  for (const a of allAssignments) {
    const list = assignmentsByVehicle.get(a.vehicleId) ?? [];
    list.push({
      driverId: a.driverId,
      fromMs: new Date(a.fromDate).getTime(),
      toMs: a.toDate ? new Date(a.toDate).getTime() : Number.POSITIVE_INFINITY,
    });
    assignmentsByVehicle.set(a.vehicleId, list);
  }
  for (const list of assignmentsByVehicle.values()) {
    list.sort((x, y) => x.fromMs - y.fromMs);
  }

  const tripsBuffer: NewTrip[] = [];
  let totalTripsInserted = 0;
  const initialMileageByVehicle = new Map<string, number>();
  const finalMileageByVehicle = new Map<string, number>();

  const flushTrips = async (): Promise<void> => {
    while (tripsBuffer.length >= BATCH_SIZE) {
      const chunk = tripsBuffer.splice(0, BATCH_SIZE);
      await db.insert(schema.trips).values(chunk);
      totalTripsInserted += chunk.length;
      if (totalTripsInserted % 5000 === 0) {
        console.log(`  trips inserted: ${totalTripsInserted.toString()}`);
      }
    }
  };

  for (const vehicle of vehiclesFull) {
    const assignments = assignmentsByVehicle.get(vehicle.id) ?? [];
    if (assignments.length === 0) continue;

    const windowStart = PERIOD_START;
    const windowEnd = vehicle.status === "retired" ? addDays(PERIOD_END, -7) : PERIOD_END;

    const ageYears = Math.max(1, 2026 - vehicle.year);
    const initialMileage = faker.number.int({
      min: ageYears * 15000,
      max: ageYears * 35000,
    });
    initialMileageByVehicle.set(vehicle.id, initialMileage);

    let cursorMileage = initialMileage;
    let cursorTime = new Date(windowStart);

    while (cursorTime.getTime() < windowEnd.getTime()) {
      const dayOfWeek = cursorTime.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const tripsToday = isWeekend
        ? faker.number.int({ min: 0, max: 2 })
        : faker.number.int({ min: 4, max: 7 });

      let dayCursor = new Date(cursorTime);
      dayCursor.setUTCHours(6, 0, 0, 0);

      for (let t = 0; t < tripsToday; t++) {
        const gapMinutes = faker.number.int({ min: 5, max: 90 });
        dayCursor = new Date(dayCursor.getTime() + gapMinutes * 60_000);

        const bucket = faker.number.int({ min: 1, max: 100 });
        const distanceKm =
          bucket <= 80
            ? faker.number.float({ min: 5, max: 50, fractionDigits: 2 })
            : bucket <= 95
              ? faker.number.float({ min: 50, max: 150, fractionDigits: 2 })
              : faker.number.float({ min: 150, max: 400, fractionDigits: 2 });

        const avgSpeed =
          distanceKm < 20
            ? faker.number.float({ min: 25, max: 50, fractionDigits: 2 })
            : distanceKm < 100
              ? faker.number.float({ min: 50, max: 90, fractionDigits: 2 })
              : faker.number.float({ min: 80, max: 110, fractionDigits: 2 });

        const durationMinutes = Math.max(1, Math.round((distanceKm / avgSpeed) * 60));
        const idleMinutes = faker.number.int({
          min: 0,
          max: Math.max(0, Math.floor(durationMinutes * 0.3)),
        });

        const startedAt = new Date(dayCursor);
        const endedAt = new Date(startedAt.getTime() + durationMinutes * 60_000);

        if (endedAt.getUTCHours() > 22 && endedAt.getUTCDate() === startedAt.getUTCDate()) break;
        if (endedAt.getTime() > windowEnd.getTime()) break;

        const startMs = startedAt.getTime();
        const assignment = assignments.find((a) => a.fromMs <= startMs && startMs < a.toMs);
        if (!assignment) {
          dayCursor = endedAt;
          continue;
        }

        const startMileageKm = cursorMileage;
        const endMileageKm = startMileageKm + Math.round(distanceKm);

        tripsBuffer.push({
          vehicleId: vehicle.id,
          driverId: assignment.driverId,
          startedAt,
          endedAt,
          startMileageKm,
          endMileageKm,
          distanceKm: (endMileageKm - startMileageKm).toFixed(2),
          durationMinutes,
          idleMinutes,
          avgSpeedKmh: avgSpeed.toFixed(2),
        });

        cursorMileage = endMileageKm;
        dayCursor = endedAt;
      }

      cursorTime = addDays(cursorTime, 1);
      cursorTime.setUTCHours(0, 0, 0, 0);

      await flushTrips();
    }

    finalMileageByVehicle.set(vehicle.id, cursorMileage);
  }

  if (tripsBuffer.length > 0) {
    await db.insert(schema.trips).values(tripsBuffer);
    totalTripsInserted += tripsBuffer.length;
    tripsBuffer.length = 0;
  }
  console.log(`Total trips inserted: ${totalTripsInserted.toString()}`);

  return { initialMileageByVehicle, finalMileageByVehicle };
}
