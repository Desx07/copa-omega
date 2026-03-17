-- XP and levels system
ALTER TABLE players ADD COLUMN IF NOT EXISTS xp int NOT NULL DEFAULT 0;

-- XP transaction log
CREATE TABLE IF NOT EXISTS xp_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount int NOT NULL,
  source text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_xp_transactions_player ON xp_transactions(player_id, created_at DESC);

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players can view own xp" ON xp_transactions FOR SELECT TO authenticated
  USING (player_id = auth.uid());
