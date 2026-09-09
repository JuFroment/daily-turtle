import { test, expect } from "@playwright/test";

test("saving a weekly review", async ({ page }) => {
  await page.goto("/");

  await page.locator("#proudInput").fill("Avoir tenu mes quêtes");
  await page.locator("#obstacleInput").fill("La fatigue");
  await page.locator("#priorityInput").fill("Dormir plus");

  await page.locator("#saveReviewBtn").click();
  await expect(page.locator("#reviewSaved")).toBeVisible();

  await page.locator('.journal-filter-btn[data-period="week"]').click();
  await expect(page.getByText("Avoir tenu mes quêtes")).toBeVisible();
  await expect(page.getByText("La fatigue")).toBeVisible();
  await expect(page.getByText("Dormir plus")).toBeVisible();
});
