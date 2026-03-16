import { test, expect, loginAs } from "./fixtures";
import { TEST_USERS, adminSupabase } from "./helpers/auth";

test.describe("Challenges", () => {
  test("player can navigate to challenges page", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/challenges");
    await page.waitForLoadState("networkidle");
    // Page should load without errors
    await expect(page.locator("body")).not.toContainText("Error interno");
  });

  test("create challenge via API and verify it appears", async ({ page }) => {
    // Get player IDs
    const { data: players } = await adminSupabase
      .from("players")
      .select("id, alias")
      .in("alias", [TEST_USERS.player1.alias, TEST_USERS.player2.alias]);

    const p1 = players!.find(p => p.alias === TEST_USERS.player1.alias)!;
    const p2 = players!.find(p => p.alias === TEST_USERS.player2.alias)!;

    // Create challenge directly
    const { data: challenge, error } = await adminSupabase
      .from("challenges")
      .insert({
        challenger_id: p1.id,
        challenged_id: p2.id,
        stars_bet: 1,
        message: "Test challenge!",
        status: "pending",
      })
      .select()
      .single();

    expect(error).toBeNull();

    // Login as player2 and check challenges
    await loginAs(page, TEST_USERS.player2.email, TEST_USERS.player2.password);
    await page.goto("/challenges");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Should see the challenge from player1
    await expect(page.locator("body")).toContainText(TEST_USERS.player1.alias);

    // Cleanup
    await adminSupabase.from("challenges").delete().eq("id", challenge!.id);
  });
});
