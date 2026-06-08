import AxeBuilder from "@axe-core/playwright";
import * as schema from "@db/schema";
import { neon } from "@neondatabase/serverless";
import { test as base, expect, type Page } from "@playwright/test";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { DashboardPage } from "../pages/dashboard.page";
import { VehiclesListPage } from "../pages/vehicles-list.page";
import { vehicleFactory } from "../support/factories";

type Db = ReturnType<typeof drizzle<typeof schema>>;

interface Fixtures {
  db: Db;
  vehiclesListPage: VehiclesListPage;
  dashboardPage: DashboardPage;
  checkA11y: (page: Page) => Promise<void>;
  createVehicle: (overrides?: Partial<schema.NewVehicle>) => Promise<schema.Vehicle>;
}

export const test = base.extend<Fixtures>({
  db: async ({}, use) => {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set in test process");
    await use(drizzle({ client: neon(url), schema }));
  },
  vehiclesListPage: async ({ page }, use) => {
    await use(new VehiclesListPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  checkA11y: async ({}, use) => {
    await use(async (page) => {
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  },
  createVehicle: async ({ db }, use) => {
    const created: schema.Vehicle[] = [];

    const create = async (overrides?: Partial<schema.NewVehicle>) => {
      const [v] = await db.insert(schema.vehicles).values(vehicleFactory(overrides)).returning();
      if (!v) throw new Error("Insert returned no row");
      created.push(v);
      return v;
    };

    await use(create);

    if (created.length > 0) {
      await db.delete(schema.vehicles).where(
        inArray(
          schema.vehicles.id,
          created.map((v) => v.id),
        ),
      );
    }
  },
});

export { expect };
