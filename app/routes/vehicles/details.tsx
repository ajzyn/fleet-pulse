import { RouteErrorFallback } from "~/components/feedback/route-error-fallback";
import VehicleDetail from "~/features/vehicles/detail";
import { parseVehicleId } from "~/features/vehicles/detail/server/detail.params.server";
import { loadVehicleDetail } from "~/features/vehicles/detail/server/loader.server";
import type { Route } from "./+types/details";

export function meta({ loaderData }: Route.MetaArgs) {
  const title = loaderData
    ? `${loaderData.vehicle.make} ${loaderData.vehicle.model} — FleetPulse`
    : "Vehicle — FleetPulse";
  return [{ title }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const id = parseVehicleId(params);
  return await loadVehicleDetail(id);
}

export default function VehicleDetailRoute({ loaderData }: Route.ComponentProps) {
  return <VehicleDetail loaderData={loaderData} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteErrorFallback error={error} resourceLabel="vehicle" />;
}
