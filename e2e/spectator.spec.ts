import { test, expect } from "@playwright/test";

test.describe("Spectator Mode", () => {
  test("spectator page loads without auth", async ({ page }) => {
    await page.goto("/espectador");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    // Should show waiting screen or bracket
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Error interno");
  });
});
