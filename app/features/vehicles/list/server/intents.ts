import z from "zod";

export const VEHICLES_INTENT = {
  updateStatus: "updateStatus",
} as const;

export const vehiclesIntentSchema = z.enum([VEHICLES_INTENT.updateStatus]);
export type VehiclesIntent = z.infer<typeof vehiclesIntentSchema>;
