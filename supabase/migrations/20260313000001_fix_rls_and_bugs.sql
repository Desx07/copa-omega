-- Fix 1: Restrict players_update_own to only allow updating name, alias, avatar_url
DROP POLICY IF EXISTS players_update_own ON players;

CREATE POLICY players_update_own ON players
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND stars = (SELECT p.stars FROM players p WHERE p.id = auth.uid())
    AND wins = (SELECT p.wins FROM players p WHERE p.id = auth.uid())
    AND losses = (SELECT p.losses FROM players p WHERE p.id = auth.uid())
    AND is_admin = (SELECT p.is_admin FROM players p WHERE p.id = auth.uid())
    AND is_eliminated = (SELECT p.is_eliminated FROM players p WHERE p.id = auth.uid())
  );

-- Fix 2: Add anon read access to players for public leaderboard
CREATE POLICY players_select_anon ON players
  FOR SELECT TO anon
  USING (true);
