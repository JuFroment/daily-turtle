import { test, expect } from "@playwright/test";

test("sorting quests by XP", async ({ page }) => {
  await page.addInitScript(
    ({ key, state }) => {
      localStorage.setItem(key, JSON.stringify(state));
    },
    {
      key: "julien-rpg-tracker-v1",
      state: {
        categories: [{ id: "cat-1", name: "Corps", description: "" }],
        quests: [
          { id: "quest-1", title: "Quête A", xp: 10, categoryId: "cat-1" },
          { id: "quest-2", title: "Quête B", xp: 30, categoryId: "cat-1" },
          { id: "quest-3", title: "Quête C", xp: 20, categoryId: "cat-1" },
        ],
      },
    },
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Corps" }).click();

  const titles = page.locator(".quest-list .quest-title");
  await expect(titles).toHaveText(["Quête A", "Quête B", "Quête C"]);

  await page.getByLabel("Trier par XP").click();
  await expect(titles).toHaveText(["Quête B", "Quête C", "Quête A"]);
});
