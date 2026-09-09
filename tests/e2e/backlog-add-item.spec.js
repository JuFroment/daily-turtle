import { test, expect } from "@playwright/test";

test("adding an item to the backlog", async ({ page }) => {
  await page.goto("/");

  const input = page.locator("#backlogInput");
  await input.fill("Trier les vieux vêtements");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();

  await expect(page.getByLabel("Trier les vieux vêtements")).toBeVisible();
  await expect(input).toHaveValue("");
});
