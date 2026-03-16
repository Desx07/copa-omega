import { test as base, expect, Page } from "@playwright/test";
import { TEST_USERS, seedTestData, cleanupTestData } from "./helpers/auth";

// Login helper
async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

export const test = base.extend<{
  adminPage: Page;
  playerPage: Page;
}>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await use(page);
    await context.close();
  },
  playerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await use(page);
    await context.close();
  },
});

export { expect, loginAs };
