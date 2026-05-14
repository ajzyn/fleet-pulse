import type { Route } from "./+types/details";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Vehicle ${params.id} — FleetPulse` }];
}

export default function VehicleDetails() {
  return <div>Vehicle Details</div>;
}
