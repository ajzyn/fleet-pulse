import z from "zod";

export const VEHICLES_INTENT = {
  updateStatus: "updateStatus",
  updatePlate: "updatePlate",
} as const;

export const vehiclesIntentSchema = z.enum([
  VEHICLES_INTENT.updateStatus,
  VEHICLES_INTENT.updatePlate,
]);
export type VehiclesIntent = z.infer<typeof vehiclesIntentSchema>;
