import type { Vehicle } from "@db/schema";

const FUEL_LABELS: Record<Vehicle["fuelType"], string> = {
  diesel: "Diesel",
  petrol: "Benzyna",
  electric: "Elektryczny",
  hybrid: "Hybryda",
};

export const getFuelLabel = (fuel: Vehicle["fuelType"]) => FUEL_LABELS[fuel];
