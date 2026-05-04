import { faker } from "@faker-js/faker";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import * as schema from "../schema";
import type { NewMaintenanceEvent } from "../schema";
import { addDays, db, PERIOD_END, type MasterData } from "./shared";

export async function injectAnomalies(input: {
  vehiclesFull: MasterData["vehiclesFull"];
  insertedDrivers: MasterData["insertedDrivers"];
  allAssignments: MasterData["allAssignments"];
  finalMileageByVehicle: Map<string, number>;
}): Promise<void> {
  console.log("Injecting anomalies...");

  const { vehiclesFull, insertedDrivers, allAssignments, finalMileageByVehicle } = input;

  const fuelable = vehiclesFull.filter((v) => v.fuelType !== "electric");
  const guzzlers = faker.helpers.arrayElements(fuelable, faker.number.int({ min: 2, max: 3 }));
  for (const g of guzzlers) {
    await db
      .update(schema.fuelTransactions)
      .set({
        liters: sql`${schema.fuelTransactions.liters}::numeric * 2`,
        cost: sql`${schema.fuelTransactions.cost}::numeric * 2`,
      })
      .where(eq(schema.fuelTransactions.vehicleId, g.id));
  }
  console.log(`  fuel guzzlers: ${guzzlers.length.toString()}`);

  const overdueTargets = faker.helpers.arrayElements(
    vehiclesFull.filter((v) => v.status !== "retired"),
    faker.number.int({ min: 1, max: 2 }),
  );
  const overdueData: NewMaintenanceEvent[] = [];
  for (const v of overdueTargets) {
    const lastMileage = finalMileageByVehicle.get(v.id) ?? 0;
    overdueData.push({
      vehicleId: v.id,
      eventAt: addDays(PERIOD_END, -faker.number.int({ min: 5, max: 30 })),
      type: faker.helpers.arrayElement(["oil_change", "inspection"]),
      status: "overdue",
      mileageAtEventKm: lastMileage - faker.number.int({ min: 0, max: 500 }),
      cost: null,
      workshopName: null,
      notes: null,
    });
  }
  if (overdueData.length > 0) {
    await db.insert(schema.maintenanceEvents).values(overdueData);
  }
  console.log(`  overdue maintenance: ${overdueData.length.toString()}`);

  const lowConsDrivers = faker.helpers.arrayElements(
    insertedDrivers,
    faker.number.int({ min: 1, max: 2 }),
  );
  let lowConsUpdates = 0;
  for (const d of lowConsDrivers) {
    const driverAssignments = allAssignments.filter((a) => a.driverId === d.id);
    for (const a of driverAssignments) {
      const fromDate = new Date(a.fromDate);
      const toDate = a.toDate ? new Date(a.toDate) : new Date("2099-01-01");
      await db
        .update(schema.fuelTransactions)
        .set({
          liters: sql`${schema.fuelTransactions.liters}::numeric * 0.7`,
          cost: sql`${schema.fuelTransactions.cost}::numeric * 0.7`,
        })
        .where(
          and(
            eq(schema.fuelTransactions.vehicleId, a.vehicleId),
            gte(schema.fuelTransactions.transactionAt, fromDate),
            lt(schema.fuelTransactions.transactionAt, toDate),
          ),
        );
      lowConsUpdates++;
    }
  }
  console.log(`  low-consumption driver windows: ${lowConsUpdates.toString()}`);
}
