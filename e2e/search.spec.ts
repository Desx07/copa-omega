import { test, expect, loginAs } from "./fixtures";
import { TEST_USERS } from "./helpers/auth";

test.describe("Search", () => {
  test("search page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/search");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("Error interno");
  });

  test("can search for a player", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/search");
    await page.waitForLoadState("networkidle");

    // Fill search input
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_USERS.player2.alias);
      // Submit search (button or Enter)
      const searchBtn = page.locator('button[type="submit"], button').filter({ hasText: /buscar|search/i });
      if (await searchBtn.count() > 0) {
        await searchBtn.first().click();
      } else {
        await searchInput.press("Enter");
      }
      await page.waitForTimeout(3000);
      await expect(page.locator("body")).toContainText(TEST_USERS.player2.alias);
    }
  });
});
