import { data } from "react-router";
import { RouteErrorFallback } from "~/components/feedback/route-error-fallback";
import VehiclesList from "~/features/vehicles/list";
import { parseVehiclesQuery } from "~/features/vehicles/list/server/list.params.server";
import { listVehicles } from "~/features/vehicles/list/server/list.repository.server";
import { VEHICLES_INTENT } from "~/features/vehicles/shared/server/intents";
import { handleUpdateStatus } from "~/features/vehicles/shared/server/update-status.action.server";
import { INTENT_FIELD, UNKNOWN_INTENT } from "~/lib/server/action";
import type { Route } from "./+types/list";

export function meta() {
  return [{ title: "Pojazdy - FleetPulse" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const query = parseVehiclesQuery(new URL(request.url));
  const page = await listVehicles(query);
  return { query, page };
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

export default function VehiclesRoute({ loaderData }: Route.ComponentProps) {
  return <VehiclesList loaderData={loaderData} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteErrorFallback error={error} resourceLabel="vehicles" />;
}
