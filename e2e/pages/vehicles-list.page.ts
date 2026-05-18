import type { Locator, Page } from "@playwright/test";
import type { Vehicle } from "@db/schema";
import { getStatusLabel } from "~/features/vehicles/list/utils/status-presentation";

export class VehiclesListPage {
  readonly table: Locator;
  readonly statusFilter: Locator;
  readonly fuelFilter: Locator;
  readonly page: Page;

  constructor(page: Page) {
    this.table = page.getByRole("table");
    this.statusFilter = page.getByLabel("Status");
    this.fuelFilter = page.getByLabel("Fuel type");
    this.page = page;
  }

  goto = () => this.page.goto("/vehicles");

  rowByPlate(plate: string) {
    return this.page.getByRole("row", { name: new RegExp(plate, "i") });
  }

  async filterByStatus(status: Vehicle["status"] | "all") {
    await this.statusFilter.click();
    const label = status === "all" ? "All statuses" : getStatusLabel(status);
    await this.page.getByRole("option", { name: label, exact: true }).click();
  }
}
