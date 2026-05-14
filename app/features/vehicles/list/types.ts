import type { fuelType, vehicleStatus } from "@db/schema";

export type FilterKey = "status" | "fuelType" | "q";
export type VehicleStatus = (typeof vehicleStatus.enumValues)[number];
export type FuelType = (typeof fuelType.enumValues)[number];
