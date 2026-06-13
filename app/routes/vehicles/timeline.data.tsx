import { data } from "react-router";
import { parseVehicleId } from "~/features/vehicles/detail/server/detail.params.server";
import { getVehicleTimeline } from "~/features/vehicles/detail/server/timeline.repository.server";
import type { Route } from "./+types/timeline.data";

export async function loader({ params, request }: Route.LoaderArgs) {
  let id: string;
  try {
    id = parseVehicleId(params);
  } catch (error) {
    if (error instanceof Error) throw error;
    return data(null, { status: 404 });
  }
  const cursor = new URL(request.url).searchParams.get("cursor");
  return getVehicleTimeline(id, cursor ? { cursor } : {});
}
