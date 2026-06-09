import type { Vehicle } from "@db/schema";

const FUEL_LABELS: Record<Vehicle["fuelType"], string> = {
  diesel: "Diesel",
  petrol: "Petrol",
  electric: "Electric",
  hybrid: "Hybrid",
};

export const getFuelLabel = (fuel: Vehicle["fuelType"]) => FUEL_LABELS[fuel];
