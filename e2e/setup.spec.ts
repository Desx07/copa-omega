import { test, expect } from "@playwright/test";
import { seedTestData, TEST_USERS } from "./helpers/auth";

test.describe("Test Environment Setup", () => {
  test("seed test users and data", async () => {
    const ids = await seedTestData();
    expect(ids.adminId).toBeTruthy();
    expect(ids.p1Id).toBeTruthy();
    expect(ids.p2Id).toBeTruthy();
    expect(ids.p3Id).toBeTruthy();
    expect(ids.p4Id).toBeTruthy();
    console.log("Test users created:", ids);
  });

  test("admin user can login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill("#email", TEST_USERS.admin.email);
    await page.fill("#password", TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    // Verify dashboard loaded
    await expect(page.locator("body")).toContainText(TEST_USERS.admin.alias);
  });

  test("player1 can login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill("#email", TEST_USERS.player1.email);
    await page.fill("#password", TEST_USERS.player1.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page.locator("body")).toContainText(TEST_USERS.player1.alias);
  });
});
