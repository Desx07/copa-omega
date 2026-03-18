CREATE TABLE IF NOT EXISTS changelog_seen (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  version text NOT NULL,
  seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, version)
);

ALTER TABLE changelog_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own" ON changelog_seen FOR SELECT TO authenticated USING (player_id = auth.uid());
CREATE POLICY "Players can insert own" ON changelog_seen FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());
