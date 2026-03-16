import { test, expect, loginAs } from "./fixtures";
import { TEST_USERS } from "./helpers/auth";

test.describe("Feed", () => {
  test("feed page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/feed");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("Error interno");
  });
});

test.describe("Chat", () => {
  test("chat page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("Error interno");
  });

  test("can send a message in chat", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/chat");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(4000);

    // The chat input has placeholder "Escribi un mensaje..."
    const msgInput = page.locator('input[placeholder*="Escribi"]');
    await expect(msgInput).toBeVisible({ timeout: 10000 });

    const testMsg = `E2E test ${Date.now()}`;
    await msgInput.fill(testMsg);

    // Send button is type="submit" inside the form
    const sendBtn = page.locator('button[type="submit"]').last();
    await sendBtn.click();
    await page.waitForTimeout(4000);

    // Message should appear in the chat
    await expect(page.locator("body")).toContainText(testMsg, { timeout: 10000 });
  });
});
