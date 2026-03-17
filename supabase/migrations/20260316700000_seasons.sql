-- Seasons system
CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  number int NOT NULL UNIQUE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  initial_stars int NOT NULL DEFAULT 25,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Season ranking snapshots (archived at season end)
CREATE TABLE IF NOT EXISTS season_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  final_stars int NOT NULL,
  final_wins int NOT NULL,
  final_losses int NOT NULL,
  final_position int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(season_id, player_id)
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_snapshots ENABLE ROW LEVEL SECURITY;

-- Everyone can read seasons
CREATE POLICY "Anyone can view seasons"
  ON seasons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon can view seasons"
  ON seasons FOR SELECT TO anon USING (true);

-- Everyone can read snapshots
CREATE POLICY "Anyone can view season snapshots"
  ON season_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon can view season snapshots"
  ON season_snapshots FOR SELECT TO anon USING (true);

CREATE INDEX idx_season_snapshots_season ON season_snapshots(season_id);
CREATE INDEX idx_season_snapshots_player ON season_snapshots(player_id);

-- Track which season a match belongs to
ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES seasons(id);
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS season_id uuid REFERENCES seasons(id);
