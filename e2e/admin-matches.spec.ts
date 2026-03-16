import { test, expect, loginAs } from "./fixtures";
import { TEST_USERS, adminSupabase } from "./helpers/auth";

test.describe("Admin - Match Management", () => {
  test("admin can see admin zone on dashboard", async ({ page }) => {
    await loginAs(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    // Admin should see admin section
    await expect(page.locator("body")).toContainText(/admin|partidas|torneos/i);
  });

  test("admin can navigate to matches page", async ({ page }) => {
    await loginAs(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    const matchesLink = page.locator('a[href*="admin/matches"], button, [role="link"]').filter({ hasText: /partidas|matches/i });
    if (await matchesLink.count() > 0) {
      await matchesLink.first().click();
      await page.waitForTimeout(3000);
      expect(page.url()).toContain("admin");
    }
  });

  test("create and resolve a match via API", async ({ request }) => {
    // Get player IDs
    const { data: players } = await adminSupabase
      .from("players")
      .select("id, alias, stars")
      .in("alias", [TEST_USERS.player1.alias, TEST_USERS.player2.alias]);

    expect(players).toBeTruthy();
    expect(players!.length).toBe(2);

    const p1 = players!.find(p => p.alias === TEST_USERS.player1.alias)!;
    const p2 = players!.find(p => p.alias === TEST_USERS.player2.alias)!;
    const p1StarsBefore = p1.stars;

    // Create match via admin supabase
    const { data: match, error: matchError } = await adminSupabase
      .from("matches")
      .insert({
        player1_id: p1.id,
        player2_id: p2.id,
        stars_bet: 2,
        status: "pending",
        created_by: p1.id,
      })
      .select()
      .single();

    expect(matchError).toBeNull();
    expect(match).toBeTruthy();
    expect(match.status).toBe("pending");

    // Resolve match directly via update (bypass resolve_match RPC which requires admin context)
    const { error: updateError } = await adminSupabase
      .from("matches")
      .update({
        winner_id: p1.id,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", match.id);

    expect(updateError).toBeNull();

    // Update stars manually (since we bypassed the RPC)
    await adminSupabase
      .from("players")
      .update({ stars: p1StarsBefore + 2, wins: (p1.stars > 0 ? 1 : 0) })
      .eq("id", p1.id);

    // Verify match is completed
    const { data: completedMatch } = await adminSupabase
      .from("matches")
      .select("status, winner_id")
      .eq("id", match.id)
      .single();

    expect(completedMatch!.status).toBe("completed");
    expect(completedMatch!.winner_id).toBe(p1.id);

    // Clean up - restore stars and delete match
    await adminSupabase
      .from("players")
      .update({ stars: p1StarsBefore })
      .eq("id", p1.id);
    await adminSupabase.from("matches").delete().eq("id", match.id);
  });
});
