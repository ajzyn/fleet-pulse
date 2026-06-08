import { vehicleStatus } from "@db/schema";
import z from "zod";

export const updateVehicleStatusSchema = z.object({
  id: z.uuid(),
  status: z.enum(vehicleStatus.enumValues),
  updatedAt: z.coerce.date(),
});

export type VehicleStatusUpdate = z.infer<typeof updateVehicleStatusSchema>;
