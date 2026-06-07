import type { Locator, Page } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly title: Locator;
  readonly kpiSection: Locator;
  readonly attentionSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByRole("heading", { name: "Dashboard", level: 1 });
    this.kpiSection = page.getByRole("region", { name: "Kluczowe wskaźniki floty" });
    this.attentionSection = page.getByRole("region", { name: "Pojazdy wymagające uwagi" });
  }

  goto = () => this.page.goto("/");

  kpiLink(name: string) {
    return this.kpiSection.getByRole("link", { name });
  }

  firstAttentionRow() {
    return this.attentionSection.getByRole("listitem").first().getByRole("link");
  }

  seeAllAttentionLink() {
    return this.attentionSection.getByRole("link", { name: /Zobacz wszystkie/ });
  }
}
