-- Copa Omega Star — Initial Schema
-- Migration: 20260313000000_initial_schema.sql

--------------------------------------------------------------------------------
-- 1. TABLES
--------------------------------------------------------------------------------

CREATE TABLE players (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  alias text NOT NULL UNIQUE,
  stars int NOT NULL DEFAULT 25 CHECK (stars >= 0),
  wins int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  is_admin boolean NOT NULL DEFAULT false,
  is_eliminated boolean NOT NULL DEFAULT false,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id uuid NOT NULL REFERENCES players(id),
  player2_id uuid NOT NULL REFERENCES players(id),
  stars_bet int NOT NULL CHECK (stars_bet BETWEEN 1 AND 5),
  winner_id uuid REFERENCES players(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_by uuid NOT NULL REFERENCES players(id),
  CHECK (player1_id != player2_id)
);

--------------------------------------------------------------------------------
-- 2. INDEXES
--------------------------------------------------------------------------------

CREATE INDEX idx_matches_player1_id ON matches(player1_id);
CREATE INDEX idx_matches_player2_id ON matches(player2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_players_stars_desc ON players(stars DESC);

--------------------------------------------------------------------------------
-- 3. RLS
--------------------------------------------------------------------------------

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- players: any authenticated user can read all players
CREATE POLICY "players_select_authenticated"
  ON players FOR SELECT
  TO authenticated
  USING (true);

-- players: users can only update their own row (name, alias, avatar_url)
CREATE POLICY "players_update_own"
  ON players FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- matches: any authenticated user can read all matches
CREATE POLICY "matches_select_authenticated"
  ON matches FOR SELECT
  TO authenticated
  USING (true);

-- matches: only admins can insert matches
CREATE POLICY "matches_insert_admin"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- matches: only admins can update matches
CREATE POLICY "matches_update_admin"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- matches: only admins can delete matches
CREATE POLICY "matches_delete_admin"
  ON matches FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

--------------------------------------------------------------------------------
-- 4. TRIGGER: auto-create player on auth.users insert
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.players (id, full_name, alias)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'alias', NEW.id::text)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

--------------------------------------------------------------------------------
-- 5. FUNCTION: resolve_match (admin-only)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_match(p_match_id uuid, p_winner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match RECORD;
  v_loser_id uuid;
  v_loser_stars int;
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.players WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Only admins can resolve matches';
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
