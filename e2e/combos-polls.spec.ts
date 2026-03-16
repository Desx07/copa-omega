import { test, expect, loginAs } from "./fixtures";
import { TEST_USERS } from "./helpers/auth";

test.describe("Combos", () => {
  test("combos page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/combos");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("Error interno");
  });

  test("can see combo form", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/combos");
    await page.waitForLoadState("networkidle");

    // Look for share/create combo toggle
    const toggleBtn = page.locator('button').filter({ hasText: /compartir|share|crear|nuevo/i });
    if (await toggleBtn.count() > 0) {
      await toggleBtn.first().click();
      await page.waitForTimeout(1000);
      // Form should be visible
      const inputs = await page.locator('input').count();
      expect(inputs).toBeGreaterThan(0);
    }
  });
});

test.describe("Polls", () => {
  test("polls page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/polls");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("Error interno");
  });
});
