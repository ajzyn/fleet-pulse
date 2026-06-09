import { data } from "react-router";
import { RouteErrorFallback } from "~/components/feedback/route-error-fallback";
import VehicleDetail from "~/features/vehicles/detail";
import { parseVehicleId } from "~/features/vehicles/detail/server/detail.params.server";
import { loadVehicleDetail } from "~/features/vehicles/detail/server/loader.server";
import { VEHICLES_INTENT } from "~/features/vehicles/shared/server/intents";
import { handleUpdateStatus } from "~/features/vehicles/shared/server/update-status.action.server";
import { INTENT_FIELD, UNKNOWN_INTENT } from "~/lib/server/action";
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

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get(INTENT_FIELD);

  switch (intent) {
    case VEHICLES_INTENT.updateStatus:
      return handleUpdateStatus(formData);
    default:
      return data({ ok: false, kind: UNKNOWN_INTENT }, { status: 400 });
  }
}

export default function VehicleDetailRoute({ loaderData }: Route.ComponentProps) {
  return <VehicleDetail loaderData={loaderData} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteErrorFallback error={error} resourceLabel="vehicle" />;
}
