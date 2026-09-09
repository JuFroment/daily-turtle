import { test, expect } from "@playwright/test";

test("editing the profile name", async ({ page }) => {
  await page.goto("/");

  await page.locator("#editProfileBtn").click();
  await page.locator("#profileNameInput").fill("Morgan");

  await page
    .locator("#profileDialog")
    .getByRole("button", { name: "Enregistrer", exact: true })
    .click();

  await expect(page.locator("#playerTitle")).toHaveText("Morgan");
});
