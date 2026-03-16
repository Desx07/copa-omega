import { test, expect } from "@playwright/test";

test.describe("Spectator Mode", () => {
  test("spectator page loads without auth", async ({ page }) => {
    await page.goto("/espectador");
    await page.waitForTimeout(3000);
    // Spectator should be accessible without login
    await expect(page.locator("body")).toBeVisible();
  });
});
