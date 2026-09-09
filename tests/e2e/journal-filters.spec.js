import { test, expect } from "@playwright/test";

test("switching journal filters", async ({ page }) => {
  await page.goto("/");

  const monthBtn = page.locator('.journal-filter-btn[data-period="month"]');
  await monthBtn.click();

  await expect(monthBtn).toHaveClass(/active/);
  await expect(page.locator(".journal-entry-title")).toContainText(
    "Chronique du mois",
  );

  const todayBtn = page.locator('.journal-filter-btn[data-period="today"]');
  await todayBtn.click();
  await expect(todayBtn).toHaveClass(/active/);
});
