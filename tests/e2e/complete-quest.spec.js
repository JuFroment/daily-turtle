import { test, expect } from "@playwright/test";

test("completing a quest updates the XP total", async ({ page }) => {
  await page.goto("/");

  const totalXp = page.locator("#totalXp");
  await expect(totalXp).toHaveText("0");

  await page.getByRole("button", { name: "Corps" }).click();

  const questCheckbox = page.getByLabel("Prendre une douche");
  await questCheckbox.check();

  await expect(totalXp).toHaveText("15");
});