import { data } from "react-router";
import { getVehicleById, type VehicleDetail } from "./vehicle.repository.server";

export type VehicleDetailData = VehicleDetail;

export const loadVehicleDetail = async (id: string): Promise<VehicleDetailData> => {
  const detail = await getVehicleById(id);
  if (!detail) throw data(null, { status: 404 });
  return detail;
};
