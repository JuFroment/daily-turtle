import { test, expect } from "@playwright/test";

test("adding an item to a checklist page in the toolbox", async ({ page }) => {
  await page.goto("/");

  const input = page
    .locator("#toolboxPage")
    .getByPlaceholder("Ajouter un item…");
  await input.fill("Trier les vieux vêtements");
  await page
    .locator("#toolboxPage")
    .getByRole("button", { name: "Ajouter" })
    .click();

  await expect(page.getByLabel("Trier les vieux vêtements")).toBeVisible();
  await expect(input).toHaveValue("");
});
