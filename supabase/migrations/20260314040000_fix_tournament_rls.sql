-- Fix: Missing UPDATE policy on tournament_participants
-- Without this, all participant stat updates (points, wins, losses, elimination) silently fail
CREATE POLICY "tp_update_admin_judge" ON tournament_participants FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_judge = true)
  );

-- Fix: Allow system to insert player_badges (badges are awarded server-side)
CREATE POLICY "pb_insert_admin" ON player_badges FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );
