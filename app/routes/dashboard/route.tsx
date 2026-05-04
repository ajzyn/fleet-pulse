import { db } from "@db/client";
import type { Route } from "./+types/route";
import { vehicles } from "@db/schema";

export async function loader() {
  const rows = await db.select().from(vehicles).limit(10);
  return { vehicles: rows };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  console.log(loaderData.vehicles);
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome to the dashboard!</p>
    </div>
  );
}
