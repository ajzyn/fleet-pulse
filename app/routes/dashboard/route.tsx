import { RouteErrorFallback } from "~/components/feedback/route-error-fallback";
// import { loadDashboard } from "~/features/dashboard/server/loader";
import type { Route } from "./+types/route";

export function meta() {
  return [{ title: "Dashboard — FleetPulse" }];
}

// export async function loader() {
//   return loadDashboard();
// }

export default function DashboardRoute() {
  return <>asda</>;
  // return (
  //   <div className="space-y-4 p-4">
  //     <h1 className="text-xl font-semibold">Dashboard</h1>
  //     <p className="text-sm text-gray-500">
  //       Dane na: <time dateTime={loaderData.generatedAt}>{loaderData.generatedAt}</time>
  //     </p>
  //     <pre className="overflow-auto rounded bg-gray-50 p-3 font-mono text-xs">
  //       {JSON.stringify(loaderData, null, 2)}
  //     </pre>
  //   </div>
  // );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <RouteErrorFallback error={error} resourceLabel="dashboard" />;
}
