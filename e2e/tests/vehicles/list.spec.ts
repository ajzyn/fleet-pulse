import { test, expect } from "../../fixtures";

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
});
