import { test, expect } from "@playwright/test";

test("navigating to a past day via the calendar shows that day's chronicle", async ({
  page,
}) => {
  const now = new Date();
  const dayKey = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);

  await page.addInitScript(
    ({ key, state }) => {
      localStorage.setItem(key, JSON.stringify(state));
    },
    {
      key: "julien-rpg-tracker-v1",
      state: {
        days: {
          [dayKey]: { completed: [], initiative: "Journée test du calendrier" },
        },
      },
    },
  );

  await page.goto("/");

  await page
    .getByRole("button", { name: "Relire une chronique passée ?" })
    .click();

  await page.locator(`.calendar-day[data-day-key="${dayKey}"]`).click();

  await expect(page.locator("#pastJournalDialog")).toBeHidden();
  await expect(page.getByText("Journée test du calendrier")).toBeVisible();
});
