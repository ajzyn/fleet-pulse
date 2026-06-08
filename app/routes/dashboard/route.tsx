import { RouteErrorFallback } from "~/components/feedback/route-error-fallback";
import { Dashboard } from "~/features/dashboard";
import { loadDashboard } from "~/features/dashboard/server/loader.server";
import type { Route } from "./+types/route";

export function meta() {
  return [{ title: "Dashboard — FleetPulse" }];
}

export async function loader() {
  return await loadDashboard();
}

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
  return <Dashboard loaderData={loaderData} />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteErrorFallback error={error} resourceLabel="dashboard" />;
}
