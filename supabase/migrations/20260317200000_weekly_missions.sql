-- Weekly missions system
CREATE TABLE IF NOT EXISTS weekly_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start date NOT NULL, -- Monday of the week
  missions jsonb NOT NULL, -- Array of mission definitions
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

CREATE TABLE IF NOT EXISTS player_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  mission_id text NOT NULL, -- matches the id in the jsonb
  completed_at timestamptz,
  UNIQUE(player_id, week_start, mission_id)
);

ALTER TABLE weekly_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view missions" ON weekly_missions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Players can view own progress" ON player_missions FOR SELECT TO authenticated USING (player_id = auth.uid());
CREATE POLICY "Players can update own progress" ON player_missions FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());

CREATE INDEX idx_player_missions_week ON player_missions(player_id, week_start);
