import * as schema from "@db/schema";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { driverFactory, vehicleFactory } from "./factories";

export const seedMinimal = async (url: string) => {
  const db = drizzle({ client: neon(url), schema });

  await db.execute(sql`
    TRUNCATE TABLE
      maintenance_events,
      fuel_transactions,
      trips,
      vehicle_assignments,
      vehicles,
      drivers
    RESTART IDENTITY CASCADE
  `);

  await db.insert(schema.drivers).values(Array.from({ length: 5 }, () => driverFactory()));

  const activeRows = Array.from({ length: 60 }, () => vehicleFactory({ status: "active" }));
  const maintenanceRows = Array.from({ length: 10 }, () =>
    vehicleFactory({ status: "in_maintenance" }),
  );
  const retiredRows = Array.from({ length: 5 }, () => vehicleFactory({ status: "retired" }));

  await db.insert(schema.vehicles).values([...activeRows, ...maintenanceRows, ...retiredRows]);
};
