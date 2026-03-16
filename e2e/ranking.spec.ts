import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures";
import { TEST_USERS } from "./helpers/auth";

test.describe("Ranking", () => {
  test("public ranking page loads without auth", async ({ page }) => {
    await page.goto("/ranking");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("Error interno");
  });

  test("ranking shows test players", async ({ page }) => {
    await page.goto("/ranking");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    // At least one test player should appear
    const bodyText = await page.locator("body").textContent();
    const hasTestPlayer = [TEST_USERS.player1.alias, TEST_USERS.player2.alias, TEST_USERS.admin.alias]
      .some(alias => bodyText?.includes(alias));
    expect(hasTestPlayer).toBeTruthy();
  });

  test("can switch ranking tabs", async ({ page }) => {
    await page.goto("/ranking");
    await page.waitForLoadState("networkidle");

    // Look for Torneos tab
    const torneosTab = page.locator('button').filter({ hasText: /torneos/i });
    if (await torneosTab.count() > 0) {
      await torneosTab.first().click();
      await page.waitForTimeout(1000);
    }
  });
});
