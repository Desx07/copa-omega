-- ============================================================================
-- TOP CUT & MULTI-STAGE TOURNAMENT SUPPORT
-- Adds top_cut and stage columns to tournaments,
-- and a stage column to tournament_matches.
-- ============================================================================

-- 1. Add top_cut and stage to tournaments
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS top_cut int,
  ADD COLUMN IF NOT EXISTS stage text;

-- Constraint: top_cut must be a power of 2 (2, 4, 8, 16, 32, 64) or null
ALTER TABLE tournaments
  ADD CONSTRAINT chk_top_cut CHECK (
    top_cut IS NULL OR top_cut IN (2, 4, 8, 16, 32, 64)
  );

-- Constraint: stage must be one of the valid values or null
ALTER TABLE tournaments
  ADD CONSTRAINT chk_stage CHECK (
    stage IS NULL OR stage IN ('group_stage', 'finals')
  );

-- 2. Add stage to tournament_matches
ALTER TABLE tournament_matches
  ADD COLUMN IF NOT EXISTS stage text;

ALTER TABLE tournament_matches
  ADD CONSTRAINT chk_match_stage CHECK (
    stage IS NULL OR stage IN ('group', 'finals')
  );

-- 3. Index for filtering matches by stage
CREATE INDEX IF NOT EXISTS idx_tournament_matches_stage
  ON tournament_matches(tournament_id, stage);

-- 4. Backfill: existing single_elimination matches get no stage (null),
--    existing round_robin/swiss matches get 'group' if tournament is in_progress
UPDATE tournament_matches tm
SET stage = 'group'
FROM tournaments t
WHERE tm.tournament_id = t.id
  AND t.format IN ('round_robin', 'swiss')
  AND tm.stage IS NULL;
