import { test, expect } from "@playwright/test";

test("editing and deleting a quest via the quest editor", async ({ page }) => {
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
          },
          {
            id: "quest-2",
            title: "Boire de l'eau",
            xp: 5,
            categoryId: "cat-1",
          },
        ],
      },
    },
  );

  await page.goto("/");

  await page.getByRole("button", { name: "Modifier", exact: true }).click();

  const row = page.locator('.editor-row[data-id="quest-1"]');
  await row.locator(".quest-title-input").fill("Prendre un bain");
  await page.locator("#saveQuestsBtn").click();

  await page.getByRole("button", { name: "Corps" }).click();
  await expect(page.getByLabel("Prendre un bain")).toBeVisible();
  await expect(page.getByLabel("Prendre une douche")).toHaveCount(0);

  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  await page
    .locator('.editor-row[data-id="quest-1"]')
    .getByRole("button", { name: "Supprimer" })
    .click();
  await page.locator("#saveQuestsBtn").click();

  await expect(page.getByLabel("Prendre un bain")).toHaveCount(0);
});
