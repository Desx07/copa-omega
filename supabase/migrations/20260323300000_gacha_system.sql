-- ============================================================
-- BeyGacha System (Random Combo Tournament)
-- Los jugadores gastan 30 OC para obtener un combo random
-- Cada pull genera blade + ratchet + bit con tier ponderado
-- ============================================================

CREATE TABLE IF NOT EXISTS gacha_pulls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  blade text NOT NULL,
  ratchet text NOT NULL,
  bit text NOT NULL,
  tier_result text NOT NULL CHECK (tier_result IN ('S', 'A', 'B', 'C')),
  tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  pulled_at timestamptz NOT NULL DEFAULT now()
);

-- Indices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_player ON gacha_pulls(player_id);
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_tournament ON gacha_pulls(tournament_id) WHERE tournament_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gacha_pulls_pulled_at ON gacha_pulls(pulled_at DESC);

-- RLS: cada jugador solo ve y crea sus propios pulls
ALTER TABLE gacha_pulls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read own gacha pulls"
  ON gacha_pulls FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Players can insert own gacha pulls"
  ON gacha_pulls FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Admins pueden ver todos los pulls (para torneos gacha)
CREATE POLICY "Admins can read all gacha pulls"
  ON gacha_pulls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true
    )
  );
