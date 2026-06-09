import z from "zod";

export const updateVehiclePlateSchema = z.object({
  id: z.uuid(),
  plateNumber: z.string().trim().min(1, "Tablica jest wymagana").max(15, "Maksymalnie 15 znaków"),
  updatedAt: z.coerce.date(),
});

export type VehiclePlateUpdate = z.infer<typeof updateVehiclePlateSchema>;
