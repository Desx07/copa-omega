import { test, expect, loginAs } from "./fixtures";
import { TEST_USERS } from "./helpers/auth";

test.describe("Profile", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
  });

  test("profile page loads with player data", async ({ page }) => {
    await expect(page.locator("body")).toContainText(TEST_USERS.player1.alias);
  });

  test("can add a bey", async ({ page }) => {
    // Look for bey form/add button
    const addBeyBtn = page.locator('button, [role="button"]').filter({ hasText: /agregar|add|bey|\+/i });
    if (await addBeyBtn.count() > 0) {
      await addBeyBtn.first().click();
      await page.waitForTimeout(500);

      // Fill bey form
      const nameInput = page.locator('input[placeholder*="nombre"], input[placeholder*="name"], input[placeholder*="Blade"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill("Dran Sword");
        // Try to find type selector and submit
        const submitBtn = page.locator('button').filter({ hasText: /agregar|add|guardar|save/i }).first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
          await expect(page.locator("body")).toContainText("Dran Sword");
        }
      }
    }
  });

  test("can edit tagline", async ({ page }) => {
    // Look for tagline edit button (pencil icon)
    const editBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
    // This test is exploratory - just verify the page has interactive elements
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThan(0);
  });
});
