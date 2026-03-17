-- Challenge comments (trash talk / hype on retos)
CREATE TABLE IF NOT EXISTS challenge_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_challenge_comments_challenge ON challenge_comments(challenge_id);

ALTER TABLE challenge_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_select_all" ON challenge_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "cc_insert_own" ON challenge_comments FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());
CREATE POLICY "cc_delete_own_admin" ON challenge_comments FOR DELETE TO authenticated
  USING (player_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
