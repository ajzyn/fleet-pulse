import { expect, test } from "../../fixtures";

test.describe("Dashboard overview", () => {
  test("renders header, KPIs and attention list", async ({ dashboardPage }) => {
    await dashboardPage.goto();

    await expect(dashboardPage.title).toBeVisible();
    await expect(
      dashboardPage.kpiSection.getByRole("heading", { name: "0 / 70 aut" }),
    ).toBeVisible();
    await expect(dashboardPage.attentionSection).toBeVisible();
    await expect(dashboardPage.firstAttentionRow()).toBeVisible();
  });

  test("KPI card drills down to active vehicles", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.kpiLink("Aktywne pojazdy").click();

    await expect(page).toHaveURL(/status=active/);
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("attention row drills down to vehicle detail", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.firstAttentionRow().click();

    await expect(page).toHaveURL(/\/vehicles\/[\w-]+$/);
  });

  test("see-all link drills down to needs-attention filter", async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.seeAllAttentionLink().click();

    await expect(page).toHaveURL(/needs_attention=true/);
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("a11y check on /", async ({ dashboardPage, page, checkA11y }) => {
    await dashboardPage.goto();
    await checkA11y(page);
  });
});
