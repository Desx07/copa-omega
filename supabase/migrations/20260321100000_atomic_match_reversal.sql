-- Atomic RPC: reverse star transfer when deleting a completed match
-- Uses FOR UPDATE locks to prevent race conditions
CREATE OR REPLACE FUNCTION public.reverse_match_stars(p_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_loser_id uuid;
  v_winner_new_stars int;
  v_loser_new_stars int;
BEGIN
  -- Verify caller is admin or judge
  IF NOT EXISTS (
    SELECT 1 FROM public.players
    WHERE id = auth.uid()
      AND (is_admin = true OR is_judge = true)
  ) THEN
    RAISE EXCEPTION 'Only admins or judges can reverse match stars';
  END IF;

  -- Lock the match row
  SELECT * INTO v_match
    FROM public.matches
    WHERE id = p_match_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found: %', p_match_id;
  END IF;

  -- Only reverse if match was completed with a winner
  IF v_match.status != 'completed' OR v_match.winner_id IS NULL THEN
    RETURN; -- nothing to reverse
  END IF;

  -- Determine the loser
  IF v_match.winner_id = v_match.player1_id THEN
    v_loser_id := v_match.player2_id;
  ELSE
    v_loser_id := v_match.player1_id;
  END IF;

  -- Lock both player rows to prevent concurrent modifications
  PERFORM 1 FROM public.players
    WHERE id IN (v_match.winner_id, v_loser_id)
    FOR UPDATE;

  -- Reverse winner: subtract stars_bet, decrement wins
  UPDATE public.players
    SET stars = stars - COALESCE(v_match.stars_bet, 0),
        wins = GREATEST(0, wins - 1)
    WHERE id = v_match.winner_id
    RETURNING stars INTO v_winner_new_stars;

  -- Reverse loser: add stars_bet, decrement losses
  UPDATE public.players
    SET stars = stars + COALESCE(v_match.stars_bet, 0),
        losses = GREATEST(0, losses - 1)
    WHERE id = v_loser_id
    RETURNING stars INTO v_loser_new_stars;

  -- If loser was eliminated and now has stars again, un-eliminate
  IF v_loser_new_stars > 0 THEN
    UPDATE public.players
      SET is_eliminated = false
      WHERE id = v_loser_id AND is_eliminated = true;
  END IF;

  -- Check if winner now has 0 or fewer stars (edge case)
  IF v_winner_new_stars <= 0 THEN
    UPDATE public.players
      SET is_eliminated = true
      WHERE id = v_match.winner_id;
  END IF;
END;
$$;


-- Atomic RPC: edit match winner (reverse old result + apply new result)
-- Used when admin/judge corrects the winner of an already-completed match
CREATE OR REPLACE FUNCTION public.edit_match_winner(
  p_match_id uuid,
  p_new_winner_id uuid,
  p_player1_score int DEFAULT NULL,
  p_player2_score int DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_match RECORD;
  v_old_loser_id uuid;
  v_new_loser_id uuid;
  v_stars_bet int;
  v_old_winner_new_stars int;
  v_old_loser_new_stars int;
BEGIN
  -- Verify caller is admin or judge
  IF NOT EXISTS (
    SELECT 1 FROM public.players
    WHERE id = auth.uid()
      AND (is_admin = true OR is_judge = true)
  ) THEN
    RAISE EXCEPTION 'Only admins or judges can edit match results';
  END IF;

  -- Lock the match row
  SELECT * INTO v_match
    FROM public.matches
    WHERE id = p_match_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found: %', p_match_id;
  END IF;

  IF v_match.status != 'completed' THEN
    RAISE EXCEPTION 'Match is not completed (current status: %)', v_match.status;
  END IF;

  -- Validate new winner is a participant
  IF p_new_winner_id != v_match.player1_id AND p_new_winner_id != v_match.player2_id THEN
    RAISE EXCEPTION 'Winner must be one of the match participants';
  END IF;

  v_stars_bet := COALESCE(v_match.stars_bet, 0);

  -- If winner actually changed, reverse old and apply new star transfers
  IF v_match.winner_id IS NOT NULL AND v_match.winner_id != p_new_winner_id THEN
    -- Determine old loser
    IF v_match.winner_id = v_match.player1_id THEN
      v_old_loser_id := v_match.player2_id;
    ELSE
      v_old_loser_id := v_match.player1_id;
    END IF;

    -- Lock both player rows
    PERFORM 1 FROM public.players
      WHERE id IN (v_match.player1_id, v_match.player2_id)
      FOR UPDATE;

    -- Old winner: reverse win (+stars_bet) and apply loss (-stars_bet) = net -2*stars_bet
    -- Also adjust wins/losses counts
    UPDATE public.players
      SET stars = stars - (2 * v_stars_bet),
          wins = GREATEST(0, wins - 1),
          losses = losses + 1
      WHERE id = v_match.winner_id
      RETURNING stars INTO v_old_winner_new_stars;

    -- Old loser: reverse loss (-stars_bet) and apply win (+stars_bet) = net +2*stars_bet
    UPDATE public.players
      SET stars = stars + (2 * v_stars_bet),
          wins = wins + 1,
          losses = GREATEST(0, losses - 1)
      WHERE id = v_old_loser_id
      RETURNING stars INTO v_old_loser_new_stars;

    -- Handle elimination status changes
    IF v_old_winner_new_stars <= 0 THEN
      UPDATE public.players SET is_eliminated = true WHERE id = v_match.winner_id;
    END IF;

    IF v_old_loser_new_stars > 0 THEN
      UPDATE public.players SET is_eliminated = false WHERE id = v_old_loser_id AND is_eliminated = true;
    END IF;
  END IF;

  -- Update the match record
  UPDATE public.matches
    SET winner_id = p_new_winner_id,
        player1_score = COALESCE(p_player1_score, v_match.player1_score),
        player2_score = COALESCE(p_player2_score, v_match.player2_score)
    WHERE id = p_match_id;
END;
$$;
