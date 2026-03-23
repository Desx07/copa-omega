-- Fix: add 'in_progress' to matches.status CHECK constraint
-- The live battle feature (20260320100000) sets status='in_progress' when a match
-- goes live, but the original CHECK constraint only allowed: pending, completed, cancelled.
-- This caused the update to fail silently via the admin client.
-- Also updates resolve_match RPC to accept both 'pending' and 'in_progress' matches.

--------------------------------------------------------------------------------
-- 1. Drop and recreate the CHECK constraint to include 'in_progress'
--------------------------------------------------------------------------------

-- Find and drop the existing CHECK constraint on matches.status
-- The constraint name from the initial schema is auto-generated; use ALTER TABLE approach
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check;

-- Re-add with all four valid statuses
ALTER TABLE matches ADD CONSTRAINT matches_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

--------------------------------------------------------------------------------
-- 2. Recreate resolve_match RPC to accept 'in_progress' matches
--------------------------------------------------------------------------------

-- The resolve_match function should allow resolving matches that are either
-- 'pending' or 'in_progress'. Previously it only accepted 'pending', which
-- meant live battles (status='in_progress') could not be resolved.
CREATE OR REPLACE FUNCTION public.resolve_match(p_match_id uuid, p_winner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_loser_id uuid;
  v_loser_stars int;
BEGIN
  -- Verify caller is admin OR judge
  IF NOT EXISTS (
    SELECT 1 FROM public.players
    WHERE id = auth.uid()
      AND (is_admin = true OR is_judge = true)
  ) THEN
    RAISE EXCEPTION 'Only admins or judges can resolve matches';
  END IF;

  -- Fetch the match and lock the row
  SELECT * INTO v_match
    FROM public.matches
    WHERE id = p_match_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found: %', p_match_id;
  END IF;

  -- Accept both 'pending' and 'in_progress' matches for resolution
  IF v_match.status NOT IN ('pending', 'in_progress') THEN
    RAISE EXCEPTION 'Match must be pending or in_progress to resolve (current status: %)', v_match.status;
  END IF;

  -- Validate winner is one of the two players
  IF p_winner_id != v_match.player1_id AND p_winner_id != v_match.player2_id THEN
    RAISE EXCEPTION 'Winner must be one of the match participants';
  END IF;

  -- Determine the loser
  IF p_winner_id = v_match.player1_id THEN
    v_loser_id := v_match.player2_id;
  ELSE
    v_loser_id := v_match.player1_id;
  END IF;

  -- Mark match as completed
  UPDATE public.matches
    SET status = 'completed',
        winner_id = p_winner_id,
        completed_at = now()
    WHERE id = p_match_id;

  -- Transfer stars: winner gains, loser loses
  UPDATE public.players
    SET stars = stars + v_match.stars_bet,
        wins = wins + 1
    WHERE id = p_winner_id;

  UPDATE public.players
    SET stars = stars - v_match.stars_bet,
        losses = losses + 1
    WHERE id = v_loser_id;

  -- Check if loser is eliminated (0 stars)
  SELECT stars INTO v_loser_stars
    FROM public.players
    WHERE id = v_loser_id;

  IF v_loser_stars <= 0 THEN
    UPDATE public.players
      SET is_eliminated = true
      WHERE id = v_loser_id;
  END IF;
END;
$$;
