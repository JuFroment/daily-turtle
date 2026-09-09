import { test, expect } from "@playwright/test";

test("calendar day cells reflect quest/note state", async ({ page }) => {
  const now = new Date();
  const key = (day) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), day))
      .toISOString()
      .slice(0, 10);

  await page.addInitScript(
    ({ storageKey, state }) => {
      localStorage.setItem(storageKey, JSON.stringify(state));
    },
    {
      storageKey: "julien-rpg-tracker-v1",
      state: {
        days: {
          [key(2)]: { completed: ["quest-1"], initiative: "" },
          [key(3)]: { completed: ["quest-1"], initiative: "Une note" },
          [key(4)]: { completed: [], initiative: "Une autre note" },
        },
      },
    },
  );

  await page.goto("/");
  await page
    .getByRole("button", { name: "Relire une chronique passée ?" })
    .click();

  const day2Classes = await page
    .locator(`.calendar-day[data-day-key="${key(2)}"]`)
    .evaluate((el) => el.className.split(/\s+/));
  expect(day2Classes).toContain("has-quests");
  expect(day2Classes).not.toContain("has-quests-and-note");

  await expect(
    page.locator(`.calendar-day[data-day-key="${key(3)}"]`),
  ).toHaveClass(/has-quests-and-note/);

  await expect(
    page.locator(`.calendar-day[data-day-key="${key(4)}"]`),
  ).toHaveClass(/has-entry/);
});
