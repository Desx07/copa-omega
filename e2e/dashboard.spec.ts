import { test, expect, loginAs } from "./fixtures";
import { TEST_USERS } from "./helpers/auth";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
  });

  test("dashboard shows player stats", async ({ page }) => {
    // Should show alias
    await expect(page.locator("body")).toContainText(TEST_USERS.player1.alias);
    // Should show stars (25 is default)
    await expect(page.locator("body")).toContainText("25");
  });

  test("dashboard has all navigation buttons", async ({ page }) => {
    // Check quick action cards exist
    const navTexts = ["Feed", "Ranking", "Perfil", "Torneos"];
    for (const text of navTexts) {
      await expect(page.locator(`text=${text}`).first()).toBeVisible();
    }
  });

  test("can navigate to ranking", async ({ page }) => {
    await page.click('text=Ranking');
    await page.waitForURL("**/ranking", { timeout: 10000 });
    await expect(page.locator("body")).toContainText(TEST_USERS.player1.alias);
  });

  test("can navigate to profile", async ({ page }) => {
    await page.click('text=Perfil');
    await page.waitForURL("**/profile", { timeout: 10000 });
    await expect(page.locator("#email, body")).toContainText(/perfil|tagline|beys/i);
  });

  test("can navigate to tournaments", async ({ page }) => {
    await page.click('text=Torneos');
    await page.waitForURL("**/tournaments", { timeout: 10000 });
  });

  test("can navigate to feed", async ({ page }) => {
    await page.click('text=Feed');
    await page.waitForURL("**/feed", { timeout: 10000 });
  });
});
