import { test, expect } from "@playwright/test";

test("exporting data downloads a JSON file", async ({ page }) => {
  await page.goto("/");

  await page.getByText("Données et réinitialisation").click();

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#exportBtn").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(
    /^quete-du-quotidien-\d{4}-\d{2}-\d{2}\.json$/,
  );
});
