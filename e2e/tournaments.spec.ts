import { test, expect, loginAs } from "./fixtures";
import { TEST_USERS, adminSupabase } from "./helpers/auth";

test.describe("Tournaments", () => {
  let tournamentId: string;

  test("tournaments page loads", async ({ page }) => {
    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto("/tournaments");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("Error interno");
  });

  test("create tournament via admin supabase", async () => {
    const { data: admin } = await adminSupabase
      .from("players")
      .select("id")
      .eq("alias", TEST_USERS.admin.alias)
      .single();

    const { data: tournament, error } = await adminSupabase
      .from("tournaments")
      .insert({
        name: "Test Tournament E2E",
        description: "Automated test tournament",
        format: "single_elimination",
        max_participants: 8,
        status: "registration",
        created_by: admin!.id,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(tournament).toBeTruthy();
    tournamentId = tournament!.id;
  });

  test("tournament detail page loads", async ({ page }) => {
    if (!tournamentId) test.skip();

    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto(`/tournaments/${tournamentId}`);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText("Test Tournament E2E");
  });

  test("player can register for tournament", async ({ page }) => {
    if (!tournamentId) test.skip();

    await loginAs(page, TEST_USERS.player1.email, TEST_USERS.player1.password);
    await page.goto(`/tournaments/${tournamentId}`);
    await page.waitForLoadState("networkidle");

    // Look for register button
    const registerBtn = page.locator('button, a').filter({ hasText: /inscribir|registrar|unir/i });
    if (await registerBtn.count() > 0) {
      await registerBtn.first().click();
      await page.waitForTimeout(3000);
      // Should show already registered
      await expect(page.locator("body")).toContainText(/inscripto|registrado|ya estas/i);
    }
  });

  test("register multiple players for tournament", async () => {
    if (!tournamentId) test.skip();

    // Register all test players
    for (const alias of [TEST_USERS.player2.alias, TEST_USERS.player3.alias, TEST_USERS.player4.alias]) {
      const { data: player } = await adminSupabase
        .from("players")
        .select("id")
        .eq("alias", alias)
        .single();

      if (player) {
        await adminSupabase
          .from("tournament_participants")
          .upsert({
            tournament_id: tournamentId,
            player_id: player.id,
          }, { onConflict: "tournament_id,player_id" });
      }
    }

    // Verify participants
    const { count } = await adminSupabase
      .from("tournament_participants")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);

    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("cleanup test tournament", async () => {
    if (!tournamentId) return;
    await adminSupabase.from("tournament_participants").delete().eq("tournament_id", tournamentId);
    await adminSupabase.from("tournament_matches").delete().eq("tournament_id", tournamentId);
    await adminSupabase.from("tournaments").delete().eq("id", tournamentId);
  });
});
