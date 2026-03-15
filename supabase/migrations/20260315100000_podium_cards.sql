-- ============================================================================
-- COPA OMEGA STAR — Podium Cards (tarjetas de podio)
-- Adds card_image_url to tournament_badges so admin can attach
-- a designed podium card image per player per tournament.
-- ============================================================================

-- 1. Add column
ALTER TABLE tournament_badges ADD COLUMN IF NOT EXISTS card_image_url text;

-- 2. Allow admins to update tournament badges (needed to set card_image_url)
CREATE POLICY "tb_update_admin" ON tournament_badges FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
