import { test, expect } from "@playwright/test";

test("adding a new category and quest via the quest editor", async ({
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
          },
        ],
      },
    },
  );

  await page.goto("/");

  await page.getByRole("button", { name: "Modifier", exact: true }).click();

  await page.locator("#addCategoryBtn").click();

  const newGroup = page.locator(".category-editor-group").last();
  await newGroup
    .locator(".category-name-input")
    .fill("Nouvelle catégorie test");

  await newGroup.locator(".add-quest-to-category-btn").click();
  const newRow = newGroup.locator(".editor-row").last();
  await newRow.locator(".quest-title-input").fill("Nouvelle quête test");
  await newRow.locator(".quest-xp-input").fill("20");

  await page.locator("#saveQuestsBtn").click();

  await page.getByRole("button", { name: "Nouvelle catégorie test" }).click();
  await expect(page.getByLabel("Nouvelle quête test")).toBeVisible();
  await expect(
    page.locator(".quest", { hasText: "Nouvelle quête test" }),
  ).toContainText("+20 XP");
});
