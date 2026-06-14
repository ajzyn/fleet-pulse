import { data } from "react-router";
import { settledToLoaderState, type LoaderState } from "~/lib/server/loader";
import type { Page } from "~/lib/server/pagination";
import { getVehicleTimeline, type TimelineEvent } from "./timeline.repository.server";
import {
  getVehicleMonthlyStats,
  type VehicleMonthlyStatsPoint,
} from "./vehicle-stats.repository.server";
import { getVehicleById, type VehicleDetail } from "./vehicle.repository.server";

export interface VehicleDetailData {
  vehicle: VehicleDetail["vehicle"];
  currentDriver: VehicleDetail["currentDriver"];
  timeline: LoaderState<Page<TimelineEvent>>;
  stats: LoaderState<VehicleMonthlyStatsPoint[]>;
}

export const loadVehicleDetail = async (id: string): Promise<VehicleDetailData> => {
  const detail = await getVehicleById(id);
  if (!detail) throw data(null, { status: 404 });

  const [timeline, stats] = await Promise.allSettled([
    getVehicleTimeline(id),
    getVehicleMonthlyStats(id),
  ]);

  return {
    ...detail,
    timeline: settledToLoaderState(timeline),
    stats: settledToLoaderState(stats),
  };
};
