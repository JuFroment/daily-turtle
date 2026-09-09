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

test("completing a quest reveals and can complete its bonus", async ({
  page,
}) => {
  await page.addInitScript(
    ({ key, state }) => {
      localStorage.setItem(key, JSON.stringify(state));
    },
    {
      key: "julien-rpg-tracker-v1",
      state: {
        categories: [{ id: "cat-1", name: "Corps", description: "" }],
        quests: [
          {
            id: "quest-1",
            title: "Prendre une douche",
            xp: 15,
            categoryId: "cat-1",
            bonusLabel: "Douche froide",
            bonusXp: 5,
          },
        ],
      },
    },
  );

  await page.goto("/");

  const totalXp = page.locator("#totalXp");
  await expect(totalXp).toHaveText("0");

  await page.getByRole("button", { name: "Corps" }).click();

  await page.getByLabel("Prendre une douche").check();
  await expect(totalXp).toHaveText("15");

  const bonusCheckbox = page.getByLabel("Douche froide");
  await expect(bonusCheckbox).toBeVisible();
  await bonusCheckbox.check();
  await expect(totalXp).toHaveText("20");
});
