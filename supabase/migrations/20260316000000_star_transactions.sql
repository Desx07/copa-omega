-- ============================================================================
-- COPA OMEGA STAR — Star Transaction Log
-- Tracks every star change for audit and history
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. STAR TRANSACTIONS TABLE
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS star_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  amount int NOT NULL, -- positive = gained, negative = lost
  balance_after int NOT NULL,
  source text NOT NULL CHECK (source IN ('match', 'tournament', 'challenge', 'admin', 'season_reset')),
  reference_id uuid, -- match_id, tournament_id, etc.
  description text, -- human-readable description
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying player history
CREATE INDEX idx_star_transactions_player ON star_transactions(player_id, created_at DESC);

-- ────────────────────────────────────────────
-- 2. RLS
-- ────────────────────────────────────────────

ALTER TABLE star_transactions ENABLE ROW LEVEL SECURITY;

-- Players can read their own transactions
CREATE POLICY "Players can view own star transactions"
  ON star_transactions FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

-- Admins can view all
CREATE POLICY "Admins can view all star transactions"
  ON star_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ────────────────────────────────────────────
-- 3. TRIGGER: auto-log star changes
-- ────────────────────────────────────────────

-- Trigger function to log star changes automatically
CREATE OR REPLACE FUNCTION log_star_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if stars actually changed
  IF OLD.stars IS DISTINCT FROM NEW.stars THEN
    INSERT INTO star_transactions (player_id, amount, balance_after, source, description)
    VALUES (
      NEW.id,
      NEW.stars - OLD.stars,
      NEW.stars,
      'match', -- default source, will be overridden by specific callers
      CASE
        WHEN NEW.stars > OLD.stars THEN 'Ganó ' || (NEW.stars - OLD.stars) || ' estrellas'
        ELSE 'Perdió ' || (OLD.stars - NEW.stars) || ' estrellas'
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_star_changes
  AFTER UPDATE OF stars ON players
  FOR EACH ROW
  EXECUTE FUNCTION log_star_transaction();
