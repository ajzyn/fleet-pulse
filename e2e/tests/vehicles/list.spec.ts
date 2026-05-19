import { expect, test } from "../../fixtures";

test.describe("Vehicles list", () => {
  test("renders table with seeded rows", async ({ vehiclesListPage, page }) => {
    await vehiclesListPage.goto();
    await expect(vehiclesListPage.table).toBeVisible();
    const rowCount = await page.getByRole("row").count();
    expect(rowCount).toBeGreaterThan(1);
  });

  test("filters by status and reflects URL", async ({ vehiclesListPage, page }) => {
    await vehiclesListPage.goto();
    await vehiclesListPage.filterByStatus("in_maintenance");
    await expect(page).toHaveURL(/status=in_maintenance/);
  });

  test("a11y check on /vehicles", async ({ vehiclesListPage, page, checkA11y }) => {
    await vehiclesListPage.goto();
    await checkA11y(page);
  });

  test("updates vehicel status and persists in db", async ({
    vehiclesListPage,
    page,
    db,
    createVehicle,
  }) => {
    const vehicle = await createVehicle({
      status: "active",
      plateNumber: `E2E-${Date.now().toString()}`,
    });

    await page.goto(`/vehicles?q=${vehicle.plateNumber}`);

    const row = vehiclesListPage.rowByPlate(vehicle.plateNumber);
    await row.getByRole("button", { name: new RegExp("change status", "i") }).click();
    await page.getByRole("menuitem", { name: "In maintenance" }).click();

    await expect(page.getByText("Status updated")).toBeVisible();

    const dbRow = await db.query.vehicles.findFirst({
      where: (v, { eq }) => eq(v.plateNumber, vehicle.plateNumber),
    });

    expect(dbRow?.status).toBe("in_maintenance");
  });
});
