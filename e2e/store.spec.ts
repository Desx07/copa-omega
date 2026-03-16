import { test, expect, loginAs } from "./fixtures";
import { TEST_USERS } from "./helpers/auth";

test.describe("Store", () => {
  test("store page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/store");
    await page.waitForLoadState("networkidle");
    // Store might be disabled - that's ok
    await expect(page.locator("body")).not.toContainText("Error interno del servidor");
  });

  test("cart page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/store/cart");
    await page.waitForLoadState("networkidle");
    // Cart should show empty or items
    await expect(page.locator("body")).not.toContainText("Error interno del servidor");
  });
});
