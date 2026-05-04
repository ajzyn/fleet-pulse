import { faker } from "@faker-js/faker";
import type { NewDriver, NewVehicle, NewVehicleAssignment } from "../schema";
import * as schema from "../schema";
import {
  addDays,
  db,
  DRIVER_COUNT,
  isoDate,
  makeUniqueGenerator,
  PERIOD_END,
  PERIOD_START,
  VEHICLE_COUNT,
  type MasterData,
} from "./shared";

export async function seedMasterData(): Promise<MasterData> {
  console.log(`Seeding ${VEHICLE_COUNT.toString()} vehicles...`);

  const nextVin = makeUniqueGenerator(() => faker.vehicle.vin());
  const nextPlate = makeUniqueGenerator(() => faker.string.alphanumeric(7).toUpperCase());

  const vehiclesData: NewVehicle[] = Array.from({ length: VEHICLE_COUNT }, () => {
    const status = faker.helpers.weightedArrayElement([
      { weight: 92, value: "active" },
      { weight: 5, value: "in_maintenance" },
      { weight: 3, value: "retired" },
    ]);
    const fuelTypeVal = faker.helpers.weightedArrayElement([
      { weight: 60, value: "diesel" },
      { weight: 25, value: "petrol" },
      { weight: 12, value: "hybrid" },
      { weight: 3, value: "electric" },
    ]);
    const year = faker.number.int({ min: 2018, max: 2024 });
    const purchaseDate = faker.date.between({
      from: new Date(`${year.toString()}-01-01T00:00:00Z`),
      to: addDays(PERIOD_START, -30),
    });

    return {
      vin: nextVin(),
      plateNumber: nextPlate(),
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year,
      fuelType: fuelTypeVal,
      status,
      purchaseDate: isoDate(purchaseDate),
      purchasePrice: faker.number.float({ min: 50000, max: 200000, fractionDigits: 2 }).toString(),
      currentMileageKm: 0,
    };
  });

  const insertedVehicles = await db.insert(schema.vehicles).values(vehiclesData).returning({
    id: schema.vehicles.id,
    year: schema.vehicles.year,
    status: schema.vehicles.status,
    fuelType: schema.vehicles.fuelType,
  });

  console.log(`Seeding ${DRIVER_COUNT.toString()} drivers...`);

  const nextEmail = makeUniqueGenerator(() => faker.internet.email());
  const nextLicense = makeUniqueGenerator(() => faker.string.alphanumeric(9).toUpperCase());

  const driversData: NewDriver[] = Array.from({ length: DRIVER_COUNT }, () => {
    const status = faker.helpers.weightedArrayElement([
      { weight: 85, value: "active" },
      { weight: 10, value: "on_leave" },
      { weight: 5, value: "terminated" },
    ]);
    const hireDate = faker.date.between({
      from: addDays(PERIOD_START, -3 * 365),
      to: addDays(PERIOD_START, -365),
    });

    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: nextEmail(),
      licenseNumber: nextLicense(),
      hireDate: isoDate(hireDate),
      status,
    };
  });

  const insertedDrivers = await db
    .insert(schema.drivers)
    .values(driversData)
    .returning({ id: schema.drivers.id, status: schema.drivers.status });

  const activeDriverIds = insertedDrivers.filter((d) => d.status === "active").map((d) => d.id);
  const allDriverIds = insertedDrivers.map((d) => d.id);

  console.log("Seeding vehicle assignments...");

  const assignmentsData: NewVehicleAssignment[] = [];

  for (const vehicle of insertedVehicles) {
    const isRetired = vehicle.status === "retired";
    const totalAssignments = isRetired
      ? 1
      : faker.helpers.weightedArrayElement([
          { weight: 50, value: 1 },
          { weight: 35, value: 2 },
          { weight: 15, value: 3 },
        ]);

    const cuts = Array.from({ length: totalAssignments - 1 }, () =>
      faker.date.between({ from: PERIOD_START, to: PERIOD_END }),
    ).sort((a, b) => a.getTime() - b.getTime());

    let cursor = PERIOD_START;
    for (const cut of cuts) {
      assignmentsData.push({
        vehicleId: vehicle.id,
        driverId: faker.helpers.arrayElement(allDriverIds),
        fromDate: isoDate(cursor),
        toDate: isoDate(cut),
      });
      cursor = cut;
    }

    const lastToDate = isRetired ? isoDate(addDays(PERIOD_END, -7)) : null;
    const lastDriverPool = isRetired ? allDriverIds : activeDriverIds;
    assignmentsData.push({
      vehicleId: vehicle.id,
      driverId: faker.helpers.arrayElement(lastDriverPool),
      fromDate: isoDate(cursor),
      toDate: lastToDate,
    });
  }

  console.log(`Inserting ${assignmentsData.length.toString()} assignments...`);
  const insertedAssignments = await db
    .insert(schema.vehicleAssignments)
    .values(assignmentsData)
    .returning({
      vehicleId: schema.vehicleAssignments.vehicleId,
      driverId: schema.vehicleAssignments.driverId,
      fromDate: schema.vehicleAssignments.fromDate,
      toDate: schema.vehicleAssignments.toDate,
    });

  return {
    vehiclesFull: insertedVehicles,
    insertedDrivers,
    allAssignments: insertedAssignments,
  };
}
