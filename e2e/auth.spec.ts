import { test, expect } from "@playwright/test";
import { TEST_USERS } from "./helpers/auth";

test.describe("Authentication Flows", () => {
  test("login page shows form elements", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('a[href="/auth/register"]')).toBeVisible();
  });

  test("register page shows all fields", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#alias")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("invalid login shows error toast", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill("#email", "nobody@fake.com");
    await page.fill("#password", "wrongwrong");
    await page.click('button[type="submit"]');
    // Wait for error toast
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({ timeout: 10000 });
    // Should stay on login page
    await expect(page).toHaveURL(/auth\/login/);
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill("#email", TEST_USERS.player1.email);
    await page.fill("#password", TEST_USERS.player1.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page.locator("body")).toContainText(TEST_USERS.player1.alias);
  });

  test("unauthenticated user redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/auth/login", { timeout: 15000 });
  });

  test("navigation between login and register", async ({ page }) => {
    await page.goto("/auth/login");
    await page.click('a[href="/auth/register"]');
    await expect(page).toHaveURL(/auth\/register/);
    await page.click('a[href="/auth/login"]');
    await expect(page).toHaveURL(/auth\/login/);
  });
});
