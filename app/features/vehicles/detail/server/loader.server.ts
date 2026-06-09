import { data } from "react-router";
import { settledToLoaderState, type LoaderState } from "~/lib/server/loader";
import { getVehicleTimeline, type VehicleTimeline } from "./timeline.repository.server";
import { getVehicleById, type VehicleDetail } from "./vehicle.repository.server";

export interface VehicleDetailData {
  vehicle: VehicleDetail["vehicle"];
  currentDriver: VehicleDetail["currentDriver"];
  timeline: LoaderState<VehicleTimeline>;
}

export const loadVehicleDetail = async (id: string): Promise<VehicleDetailData> => {
  const detail = await getVehicleById(id);
  if (!detail) throw data(null, { status: 404 });

  const [timeline] = await Promise.allSettled([getVehicleTimeline(id)]);

  return { ...detail, timeline: settledToLoaderState(timeline) };
};
