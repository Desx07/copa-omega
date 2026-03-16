import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Copa Omega/i);
  });

  test("landing has key elements", async ({ page }) => {
    await page.goto("/");
    // Check for logo or heading
    const heading = page.locator("h1").first();
    await expect(heading).toBeVisible();
    // Check for CTA buttons (login/register)
    const buttons = page.locator('a[href*="auth"], button').filter({ hasText: /registr|login|entrar|unir/i });
    await expect(buttons.first()).toBeVisible();
  });

  test("public ranking page loads", async ({ page }) => {
    await page.goto("/ranking");
    await page.waitForTimeout(2000);
    // Ranking should be accessible without auth
    await expect(page.locator("body")).not.toHaveText(/No autorizado/i);
  });
});
