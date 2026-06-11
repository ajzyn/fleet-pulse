import { parseVehicleId } from "~/features/vehicles/detail/server/detail.params.server";
import { getVehicleTimeline } from "~/features/vehicles/detail/server/timeline.repository.server";
import type { Route } from "./+types/timeline.data";

export async function loader({ params, request }: Route.LoaderArgs) {
  const id = parseVehicleId(params);
  const cursor = new URL(request.url).searchParams.get("cursor");
  return getVehicleTimeline(id, cursor ? { cursor } : {});
}
