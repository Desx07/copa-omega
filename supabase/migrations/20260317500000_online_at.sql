-- Add online_at column for heartbeat-based presence tracking
ALTER TABLE players ADD COLUMN IF NOT EXISTS online_at timestamptz;

-- Index for efficient "who's online" queries
CREATE INDEX IF NOT EXISTS idx_players_online_at ON players(online_at)
  WHERE online_at IS NOT NULL;
