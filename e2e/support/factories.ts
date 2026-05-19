import type { NewDriver, NewVehicle } from "@db/schema";
import { faker } from "@faker-js/faker";

const FUEL_TYPES = ["diesel", "petrol", "electric", "hybrid"] as const;
const STATUSES = ["active", "in_maintenance", "retired"] as const;

export const vehicleFactory = (overrides: Partial<NewVehicle> = {}): NewVehicle => {
  const year = faker.number.int({ min: 2018, max: 2024 });
  return {
    vin: faker.vehicle.vin(),
    plateNumber: faker.string.alphanumeric(7).toUpperCase(),
    make: faker.vehicle.manufacturer(),
    model: faker.vehicle.model(),
    year,
    fuelType: faker.helpers.arrayElement(FUEL_TYPES),
    status: faker.helpers.arrayElement(STATUSES),
    purchaseDate: faker.date.past({ years: 5 }).toISOString().slice(0, 10),
    purchasePrice: faker.number.float({ min: 50000, max: 200000, fractionDigits: 2 }).toString(),
    currentMileageKm: faker.number.int({ min: 0, max: 200_000 }),
    ...overrides,
  };
};

export const driverFactory = (overrides: Partial<NewDriver> = {}): NewDriver => {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    licenseNumber: faker.string.alphanumeric(10).toUpperCase(),
    hireDate: faker.date.past({ years: 3 }).toISOString().slice(0, 10),
    status: "active",
    ...overrides,
  };
};
