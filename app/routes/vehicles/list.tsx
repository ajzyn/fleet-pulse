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
  return [{ title: "Vehicles — FleetPulse" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const query = parseVehiclesQuery(new URL(request.url));
  const result = await listVehicles(query);
  return { query, ...result };
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

interface CacheEntry {
  data: Awaited<ReturnType<typeof loader>>;
  ts: number;
}
const cache = new Map<string, CacheEntry>();
const STALE_MS = 30000;

export async function clientLoader({ request, serverLoader }: Route.ClientLoaderArgs) {
  const key = new URL(request.url).search;
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < STALE_MS) {
    return entry.data;
  }
  const fresh = await serverLoader();
  cache.set(key, { data: fresh, ts: Date.now() });
  return fresh;
}
clientLoader.hydrate = true as const;

export async function clientAction({ serverAction }: Route.ClientActionArgs) {
  cache.clear();
  return serverAction();
}

export default function VehiclesRoute({ loaderData }: Route.ComponentProps) {
  return <VehiclesList loaderData={loaderData} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteErrorFallback error={error} resourceLabel="vehicles" />;
}
