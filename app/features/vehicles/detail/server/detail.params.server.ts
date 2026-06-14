import { data } from "react-router";
import z from "zod";

const VehicleIdParam = z.uuid();

export const parseVehicleId = (params: { id?: string }): string => {
  const parsed = VehicleIdParam.safeParse(params.id);
  if (!parsed.success) throw data(null, { status: 404 });
  return parsed.data;
};
