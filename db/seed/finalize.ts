import { sql } from "drizzle-orm";
import { db } from "./shared";

export async function finalize(): Promise<void> {
  console.log("Updating vehicle denormalized fields...");

  await db.execute(sql`
    UPDATE vehicles
    SET current_mileage_km = t.max_km
    FROM (
      SELECT vehicle_id, MAX(end_mileage_km) AS max_km
      FROM trips
      GROUP BY vehicle_id
    ) t
    WHERE vehicles.id = t.vehicle_id
  `);

  await db.execute(sql`
    UPDATE vehicles
    SET last_service_at = m.last_at
    FROM (
      SELECT vehicle_id, MAX(event_at) AS last_at
      FROM maintenance_events
      WHERE status = 'completed'
      GROUP BY vehicle_id
    ) m
    WHERE vehicles.id = m.vehicle_id
  `);
}
