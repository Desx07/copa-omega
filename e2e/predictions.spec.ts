import { test, expect, loginAs } from "./fixtures";
import { TEST_USERS } from "./helpers/auth";

test.describe("Predictions", () => {
  test("predictions page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/predictions");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("Error interno");
  });

  test("can switch between tabs", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/predictions");
    await page.waitForLoadState("networkidle");

    // Look for leaderboard tab
    const leaderboardTab = page.locator('button').filter({ hasText: /leaderboard|ranking|tabla/i });
    if (await leaderboardTab.count() > 0) {
      await leaderboardTab.first().click();
      await page.waitForTimeout(1000);
    }
  });
});
