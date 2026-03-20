-- Fix: allow judges (is_judge=true) to INSERT, UPDATE, DELETE matches
-- Previously all 3 policies only checked is_admin=true, blocking judges

-- 1. DROP and recreate INSERT policy to include judges
DROP POLICY IF EXISTS matches_insert_admin ON public.matches;
CREATE POLICY matches_insert_admin ON public.matches
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = auth.uid()
        AND (players.is_admin = true OR players.is_judge = true)
    )
  );

-- 2. DROP and recreate UPDATE policy to include judges
DROP POLICY IF EXISTS matches_update_admin ON public.matches;
CREATE POLICY matches_update_admin ON public.matches
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = auth.uid()
        AND (players.is_admin = true OR players.is_judge = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = auth.uid()
        AND (players.is_admin = true OR players.is_judge = true)
    )
  );

-- 3. DROP and recreate DELETE policy to include judges
DROP POLICY IF EXISTS matches_delete_admin ON public.matches;
CREATE POLICY matches_delete_admin ON public.matches
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = auth.uid()
        AND (players.is_admin = true OR players.is_judge = true)
    )
  );

-- 4. Fix resolve_match RPC to also allow judges
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

  IF v_match.status != 'pending' THEN
    RAISE EXCEPTION 'Match is not pending (current status: %)', v_match.status;
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
