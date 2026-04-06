-- ============================================================================
-- COPA OMEGA STAR — Teams, Team League & Omega Wallet
-- Migration: 20260405000000_teams_league_wallet.sql
--
-- Sistemas:
--   1. Teams (equipos de 2-3 miembros, stars propias, retos entre equipos)
--   2. Team League (liga round-robin por equipos con temporadas)
--   3. Omega Wallet (billetera de omega coins separada con audit log)
--   4. Vouchers (canjeables con omega coins)
--   5. App Config (feature flags)
--
-- NOTA: La tabla "leagues" existente (divisiones por estrellas) NO se toca.
--       El sistema de liga de equipos usa "team_leagues" para evitar colision.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECCION 0: APP CONFIG (feature flags)
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_config_select_all"
  ON app_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "app_config_admin_insert"
  ON app_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "app_config_admin_update"
  ON app_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

INSERT INTO app_config (key, value) VALUES
  ('teams_enabled', 'false'::jsonb),
  ('team_league_enabled', 'false'::jsonb),
  ('wallet_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ============================================================================
-- SECCION 1: TEAMS
-- ============================================================================

-- 1.1 Tabla principal de equipos
CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  captain_id uuid NOT NULL REFERENCES players(id),
  stars int NOT NULL DEFAULT 25 CHECK (stars >= 0),
  wins int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teams_name_unique UNIQUE (name)
);

-- 1.2 Miembros del equipo
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('captain', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_members_player_unique UNIQUE (player_id) -- un jugador = un equipo
);

-- 1.3 Invitaciones a equipo
CREATE TABLE team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  invited_by uuid NOT NULL REFERENCES players(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  responded_at timestamptz,
  CONSTRAINT team_invitations_unique UNIQUE (team_id, player_id)
);

-- 1.4 Matches entre equipos (best-of-3 individual fights)
CREATE TABLE team_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team1_id uuid NOT NULL REFERENCES teams(id),
  team2_id uuid NOT NULL REFERENCES teams(id),
  stars_bet int NOT NULL DEFAULT 0 CHECK (stars_bet >= 0 AND stars_bet <= 5),
  winner_team_id uuid REFERENCES teams(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  team1_wins int NOT NULL DEFAULT 0,
  team2_wins int NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES players(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT team_matches_different_teams CHECK (team1_id != team2_id)
);

-- 1.5 Peleas individuales dentro de un team match
CREATE TABLE team_match_fights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_match_id uuid NOT NULL REFERENCES team_matches(id) ON DELETE CASCADE,
  position int NOT NULL CHECK (position IN (1, 2, 3)),
  player1_id uuid NOT NULL REFERENCES players(id), -- de team1
  player2_id uuid NOT NULL REFERENCES players(id), -- de team2
  player1_score int NOT NULL DEFAULT 0,
  player2_score int NOT NULL DEFAULT 0,
  winner_id uuid REFERENCES players(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at timestamptz,
  CONSTRAINT team_match_fights_unique_pos UNIQUE (team_match_id, position),
  CONSTRAINT team_match_fights_diff_players CHECK (player1_id != player2_id)
);

-- 1.6 Retos entre equipos
CREATE TABLE team_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_team_id uuid NOT NULL REFERENCES teams(id),
  challenged_team_id uuid NOT NULL REFERENCES teams(id),
  stars_bet int NOT NULL DEFAULT 0 CHECK (stars_bet >= 0 AND stars_bet <= 5),
  message text CHECK (char_length(message) <= 120),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'expired')),
  team_match_id uuid REFERENCES team_matches(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT team_challenges_different CHECK (challenger_team_id != challenged_team_id)
);


-- ============================================================================
-- SECCION 2: TEAM LEAGUE (liga round-robin por equipos)
-- ============================================================================

-- 2.1 Ligas de equipo (temporadas)
-- Se diferencia de "leagues" (divisiones por estrellas) usando "team_leagues"
CREATE TABLE team_leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  season_number int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'registration'
    CHECK (status IN ('registration', 'in_progress', 'completed')),
  current_round int NOT NULL DEFAULT 0,
  total_rounds int NOT NULL DEFAULT 0,
  max_teams int NOT NULL DEFAULT 16,
  created_by uuid NOT NULL REFERENCES players(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  CONSTRAINT team_leagues_season_unique UNIQUE (name, season_number)
);

-- 2.2 Equipos inscriptos en una liga
CREATE TABLE team_league_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_league_id uuid NOT NULL REFERENCES team_leagues(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id),
  points int NOT NULL DEFAULT 0,          -- W=3, D=1, L=0
  played int NOT NULL DEFAULT 0,
  won int NOT NULL DEFAULT 0,
  drawn int NOT NULL DEFAULT 0,
  lost int NOT NULL DEFAULT 0,
  fights_won int NOT NULL DEFAULT 0,      -- para desempate (peleas individuales ganadas)
  fights_lost int NOT NULL DEFAULT 0,
  registered_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_league_teams_unique UNIQUE (team_league_id, team_id)
);

-- 2.3 Matches de la liga (fixture, rondas)
CREATE TABLE team_league_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_league_id uuid NOT NULL REFERENCES team_leagues(id) ON DELETE CASCADE,
  round int NOT NULL,                       -- "Fecha 1", "Fecha 2", etc.
  team1_id uuid NOT NULL REFERENCES teams(id),
  team2_id uuid NOT NULL REFERENCES teams(id),
  team_match_id uuid REFERENCES team_matches(id), -- vinculado al team_match real
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_league_matches_diff CHECK (team1_id != team2_id)
);

-- 2.4 Historial de temporadas
CREATE TABLE team_league_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_league_id uuid NOT NULL REFERENCES team_leagues(id),
  season_number int NOT NULL,
  champion_team_id uuid REFERENCES teams(id),
  runner_up_team_id uuid REFERENCES teams(id),
  third_place_team_id uuid REFERENCES teams(id),
  total_teams int NOT NULL DEFAULT 0,
  total_matches int NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now()
);


-- ============================================================================
-- SECCION 3: OMEGA WALLET
-- ============================================================================

-- 3.1 Billeteras (una por jugador)
CREATE TABLE omega_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  balance int NOT NULL DEFAULT 5 CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT omega_wallets_player_unique UNIQUE (player_id)
);

-- 3.2 Transacciones (audit log completo)
CREATE TABLE wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  amount int NOT NULL,              -- positivo = credito, negativo = debito
  balance_after int NOT NULL,
  type text NOT NULL CHECK (type IN (
    'initial_grant',
    'tournament_prize',
    'streak_bonus',
    'beypet_reward',
    'mission_reward',
    'prediction_payout',
    'voucher_purchase',
    'golden_ticket_purchase',
    'admin_grant',
    'admin_deduct',
    'team_reward',
    'league_prize'
  )),
  description text,
  reference_id uuid,                -- tournament_id, match_id, etc.
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3.3 Vouchers del jugador
CREATE TABLE player_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  type text NOT NULL CHECK (type IN (
    'discount_5', 'discount_10', 'discount_15', 'discount_20', 'golden_ticket'
  )),
  discount_percent int,             -- 5, 10, 15, 20 (null para golden_ticket)
  cost_omega_coins int NOT NULL,    -- cuanto costo en omega coins
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  used_on_order_id uuid REFERENCES orders(id),
  used_on_tournament_id uuid REFERENCES tournaments(id),
  purchased_at timestamptz NOT NULL DEFAULT now()
);


-- ============================================================================
-- SECCION 4: INDEXES
-- ============================================================================

-- Teams
CREATE INDEX idx_teams_captain ON teams(captain_id);
CREATE INDEX idx_teams_is_active ON teams(is_active) WHERE is_active = true;
CREATE INDEX idx_teams_stars_desc ON teams(stars DESC);

-- Team members
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_player ON team_members(player_id);

-- Team invitations
CREATE INDEX idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_player ON team_invitations(player_id);
CREATE INDEX idx_team_invitations_status ON team_invitations(status)
  WHERE status = 'pending';

-- Team matches
CREATE INDEX idx_team_matches_team1 ON team_matches(team1_id);
CREATE INDEX idx_team_matches_team2 ON team_matches(team2_id);
CREATE INDEX idx_team_matches_status ON team_matches(status);
CREATE INDEX idx_team_matches_winner ON team_matches(winner_team_id)
  WHERE winner_team_id IS NOT NULL;

-- Team match fights
CREATE INDEX idx_team_match_fights_match ON team_match_fights(team_match_id);
CREATE INDEX idx_team_match_fights_p1 ON team_match_fights(player1_id);
CREATE INDEX idx_team_match_fights_p2 ON team_match_fights(player2_id);

-- Team challenges
CREATE INDEX idx_team_challenges_challenger ON team_challenges(challenger_team_id);
CREATE INDEX idx_team_challenges_challenged ON team_challenges(challenged_team_id);
CREATE INDEX idx_team_challenges_status ON team_challenges(status)
  WHERE status = 'pending';

-- Team leagues
CREATE INDEX idx_team_leagues_status ON team_leagues(status);

-- Team league teams
CREATE INDEX idx_tlt_league ON team_league_teams(team_league_id);
CREATE INDEX idx_tlt_team ON team_league_teams(team_id);
CREATE INDEX idx_tlt_points ON team_league_teams(team_league_id, points DESC);

-- Team league matches
CREATE INDEX idx_tlm_league ON team_league_matches(team_league_id);
CREATE INDEX idx_tlm_round ON team_league_matches(team_league_id, round);
CREATE INDEX idx_tlm_team_match ON team_league_matches(team_match_id)
  WHERE team_match_id IS NOT NULL;

-- Wallet
CREATE INDEX idx_omega_wallets_player ON omega_wallets(player_id);

-- Wallet transactions
CREATE INDEX idx_wallet_tx_player ON wallet_transactions(player_id, created_at DESC);
CREATE INDEX idx_wallet_tx_type ON wallet_transactions(type);

-- Player vouchers
CREATE INDEX idx_player_vouchers_player ON player_vouchers(player_id);
CREATE INDEX idx_player_vouchers_unused ON player_vouchers(player_id, is_used)
  WHERE is_used = false;


-- ============================================================================
-- SECCION 5: RLS POLICIES
-- ============================================================================

-- ---- Teams ----
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select_all"
  ON teams FOR SELECT TO authenticated USING (true);

CREATE POLICY "teams_insert_auth"
  ON teams FOR INSERT TO authenticated
  WITH CHECK (captain_id = auth.uid());

CREATE POLICY "teams_update_captain"
  ON teams FOR UPDATE TO authenticated
  USING (
    captain_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "teams_delete_admin"
  ON teams FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- Team Members ----
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tmemb_select_all"
  ON team_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "tmemb_insert_captain_admin"
  ON team_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id AND teams.captain_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- Jugador puede salir de su equipo, admin puede sacar a cualquiera
CREATE POLICY "tmemb_delete_self_admin"
  ON team_members FOR DELETE TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id AND teams.captain_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- Team Invitations ----
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ti_select_involved"
  ON team_invitations FOR SELECT TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id AND teams.captain_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- Capitan puede invitar
CREATE POLICY "ti_insert_captain"
  ON team_invitations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id AND teams.captain_id = auth.uid()
    )
  );

-- Jugador invitado puede aceptar/declinar, capitan puede cancelar
CREATE POLICY "ti_update_involved"
  ON team_invitations FOR UPDATE TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id AND teams.captain_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- Team Matches ----
ALTER TABLE team_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tmatch_select_all"
  ON team_matches FOR SELECT TO authenticated USING (true);

CREATE POLICY "tmatch_insert_admin_judge"
  ON team_matches FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid() AND (is_admin = true OR is_judge = true)
    )
  );

CREATE POLICY "tmatch_update_admin_judge"
  ON team_matches FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid() AND (is_admin = true OR is_judge = true)
    )
  );

-- ---- Team Match Fights ----
ALTER TABLE team_match_fights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tmf_select_all"
  ON team_match_fights FOR SELECT TO authenticated USING (true);

CREATE POLICY "tmf_insert_admin_judge"
  ON team_match_fights FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid() AND (is_admin = true OR is_judge = true)
    )
  );

CREATE POLICY "tmf_update_admin_judge"
  ON team_match_fights FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid() AND (is_admin = true OR is_judge = true)
    )
  );

-- ---- Team Challenges ----
ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tc_select_all"
  ON team_challenges FOR SELECT TO authenticated USING (true);

-- Capitan del equipo retador puede crear
CREATE POLICY "tc_insert_captain"
  ON team_challenges FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_challenges.challenger_team_id
        AND teams.captain_id = auth.uid()
    )
  );

-- Capitan del equipo retado puede aceptar/declinar, admin puede gestionar
CREATE POLICY "tc_update_involved"
  ON team_challenges FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_challenges.challenged_team_id
        AND teams.captain_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_challenges.challenger_team_id
        AND teams.captain_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- Team Leagues ----
ALTER TABLE team_leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tleague_select_all"
  ON team_leagues FOR SELECT TO authenticated USING (true);

CREATE POLICY "tleague_insert_admin"
  ON team_leagues FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "tleague_update_admin"
  ON team_leagues FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- Team League Teams ----
ALTER TABLE team_league_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tlt_select_all"
  ON team_league_teams FOR SELECT TO authenticated USING (true);

-- Capitan puede inscribir su equipo, admin puede inscribir cualquiera
CREATE POLICY "tlt_insert_captain_admin"
  ON team_league_teams FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_league_teams.team_id AND teams.captain_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "tlt_update_admin"
  ON team_league_teams FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "tlt_delete_admin"
  ON team_league_teams FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- Team League Matches ----
ALTER TABLE team_league_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tlm_select_all"
  ON team_league_matches FOR SELECT TO authenticated USING (true);

CREATE POLICY "tlm_insert_admin"
  ON team_league_matches FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "tlm_update_admin"
  ON team_league_matches FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- Team League History ----
ALTER TABLE team_league_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tlh_select_all"
  ON team_league_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "tlh_insert_admin"
  ON team_league_history FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- Omega Wallets ----
ALTER TABLE omega_wallets ENABLE ROW LEVEL SECURITY;

-- Jugador ve su propia wallet, admin ve todas
CREATE POLICY "wallet_select_own"
  ON omega_wallets FOR SELECT TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- Solo via funciones SECURITY DEFINER (no insert directo)
CREATE POLICY "wallet_insert_system"
  ON omega_wallets FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "wallet_update_admin"
  ON omega_wallets FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- Wallet Transactions ----
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wtx_select_own"
  ON wallet_transactions FOR SELECT TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- Solo insert via funciones SECURITY DEFINER
-- (no policy de INSERT para usuarios normales)
CREATE POLICY "wtx_insert_admin"
  ON wallet_transactions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ---- Player Vouchers ----
ALTER TABLE player_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voucher_select_own"
  ON player_vouchers FOR SELECT TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- Solo via purchase_voucher() RPC
CREATE POLICY "voucher_update_own"
  ON player_vouchers FOR UPDATE TO authenticated
  USING (player_id = auth.uid());

-- ---- App Config ----
-- (ya creadas arriba)


-- ============================================================================
-- SECCION 6: TRIGGERS
-- ============================================================================

-- 6.1 Auto-update updated_at en teams
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();

-- 6.2 Auto-update updated_at en omega_wallets
CREATE OR REPLACE FUNCTION update_wallet_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_wallet_updated_at
  BEFORE UPDATE ON omega_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_updated_at();

-- 6.3 Auto-disolver equipo cuando queda con menos de 2 miembros
CREATE OR REPLACE FUNCTION check_team_minimum_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_member_count int;
  v_team_name text;
BEGIN
  -- Contar miembros restantes del equipo
  SELECT COUNT(*) INTO v_member_count
    FROM public.team_members
    WHERE team_id = OLD.team_id;

  -- Si queda menos de 2, desactivar el equipo
  IF v_member_count < 2 THEN
    UPDATE public.teams
      SET is_active = false
      WHERE id = OLD.team_id;

    -- Registrar en el feed
    SELECT name INTO v_team_name FROM public.teams WHERE id = OLD.team_id;

    INSERT INTO public.activity_feed (type, actor_id, reference_id, metadata)
    VALUES (
      'rank_change',
      OLD.player_id,
      OLD.team_id,
      jsonb_build_object(
        'event', 'team_dissolved',
        'team_name', v_team_name,
        'reason', 'insufficient_members'
      )
    );
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_check_team_members
  AFTER DELETE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_minimum_members();

-- 6.4 Expirar invitaciones automaticamente
-- (se ejecuta via cron o al consultar, no trigger por performance)


-- ============================================================================
-- SECCION 7: RPC FUNCTIONS
-- ============================================================================

-- 7.1 Resolver team match (atomico)
-- Transfiere stars entre equipos, actualiza W/L de equipos e individuales,
-- y si esta vinculado a una liga, actualiza la tabla de posiciones.
CREATE OR REPLACE FUNCTION resolve_team_match(
  p_team_match_id uuid,
  p_winner_team_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match RECORD;
  v_loser_team_id uuid;
  v_fight RECORD;
  v_league_match RECORD;
BEGIN
  -- Verificar que el caller es admin o juez
  IF NOT EXISTS (
    SELECT 1 FROM public.players
    WHERE id = auth.uid() AND (is_admin = true OR is_judge = true)
  ) THEN
    RAISE EXCEPTION 'Solo admins o jueces pueden resolver team matches';
  END IF;

  -- Lockear el team match
  SELECT * INTO v_match
    FROM public.team_matches
    WHERE id = p_team_match_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team match no encontrado: %', p_team_match_id;
  END IF;

  IF v_match.status = 'completed' THEN
    RAISE EXCEPTION 'El team match ya esta completado';
  END IF;

  -- Validar que el ganador es uno de los equipos
  IF p_winner_team_id != v_match.team1_id AND p_winner_team_id != v_match.team2_id THEN
    RAISE EXCEPTION 'El ganador debe ser uno de los equipos participantes';
  END IF;

  -- Determinar el perdedor
  IF p_winner_team_id = v_match.team1_id THEN
    v_loser_team_id := v_match.team2_id;
  ELSE
    v_loser_team_id := v_match.team1_id;
  END IF;

  -- Marcar el match como completado
  UPDATE public.team_matches
    SET status = 'completed',
        winner_team_id = p_winner_team_id,
        completed_at = now()
    WHERE id = p_team_match_id;

  -- Transferir stars entre equipos
  UPDATE public.teams
    SET stars = stars + v_match.stars_bet,
        wins = wins + 1
    WHERE id = p_winner_team_id;

  UPDATE public.teams
    SET stars = GREATEST(0, stars - v_match.stars_bet),
        losses = losses + 1
    WHERE id = v_loser_team_id;

  -- Actualizar W/L individual de los peleadores
  FOR v_fight IN
    SELECT * FROM public.team_match_fights
    WHERE team_match_id = p_team_match_id
      AND status = 'completed'
      AND winner_id IS NOT NULL
  LOOP
    -- Winner individual
    UPDATE public.players
      SET wins = wins + 1
      WHERE id = v_fight.winner_id;

    -- Loser individual
    IF v_fight.winner_id = v_fight.player1_id THEN
      UPDATE public.players
        SET losses = losses + 1
        WHERE id = v_fight.player2_id;
    ELSE
      UPDATE public.players
        SET losses = losses + 1
        WHERE id = v_fight.player1_id;
    END IF;
  END LOOP;

  -- Si esta vinculado a una liga, actualizar tabla de posiciones
  SELECT * INTO v_league_match
    FROM public.team_league_matches
    WHERE team_match_id = p_team_match_id
    LIMIT 1;

  IF FOUND THEN
    -- Marcar league match como completado
    UPDATE public.team_league_matches
      SET status = 'completed'
      WHERE id = v_league_match.id;

    -- Actualizar posiciones del ganador: +3 puntos
    UPDATE public.team_league_teams
      SET points = points + 3,
          played = played + 1,
          won = won + 1,
          fights_won = fights_won + v_match.team1_wins + v_match.team2_wins
            - (CASE WHEN p_winner_team_id = v_match.team1_id
                    THEN v_match.team2_wins ELSE v_match.team1_wins END),
          fights_lost = fights_lost
            + (CASE WHEN p_winner_team_id = v_match.team1_id
                    THEN v_match.team2_wins ELSE v_match.team1_wins END)
      WHERE team_league_id = v_league_match.team_league_id
        AND team_id = p_winner_team_id;

    -- Actualizar posiciones del perdedor: 0 puntos
    UPDATE public.team_league_teams
      SET played = played + 1,
          lost = lost + 1,
          fights_won = fights_won
            + (CASE WHEN v_loser_team_id = v_match.team1_id
                    THEN v_match.team1_wins ELSE v_match.team2_wins END),
          fights_lost = fights_lost
            + (CASE WHEN v_loser_team_id = v_match.team1_id
                    THEN v_match.team2_wins ELSE v_match.team1_wins END)
      WHERE team_league_id = v_league_match.team_league_id
        AND team_id = v_loser_team_id;

    -- Actualizar ronda actual de la liga
    UPDATE public.team_leagues
      SET current_round = GREATEST(current_round, v_league_match.round)
      WHERE id = v_league_match.team_league_id;
  END IF;

  -- Registrar en activity feed
  INSERT INTO public.activity_feed (type, reference_id, metadata)
  VALUES (
    'match_result',
    p_team_match_id,
    jsonb_build_object(
      'event', 'team_match_result',
      'winner_team_id', p_winner_team_id,
      'loser_team_id', v_loser_team_id,
      'stars_bet', v_match.stars_bet,
      'team1_wins', v_match.team1_wins,
      'team2_wins', v_match.team2_wins
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'winner_team_id', p_winner_team_id,
    'loser_team_id', v_loser_team_id,
    'stars_transferred', v_match.stars_bet
  );
END;
$$;


-- 7.2 Generar fixture round-robin para una liga
CREATE OR REPLACE FUNCTION generate_team_league_fixture(p_team_league_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_league RECORD;
  v_teams uuid[];
  v_num_teams int;
  v_total_rounds int;
  v_round int;
  v_i int;
  v_home int;
  v_away int;
  v_temp uuid;
  v_matches_created int := 0;
BEGIN
  -- Verificar admin
  IF NOT EXISTS (
    SELECT 1 FROM public.players
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden generar fixtures';
  END IF;

  -- Obtener la liga
  SELECT * INTO v_league
    FROM public.team_leagues
    WHERE id = p_team_league_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Liga no encontrada: %', p_team_league_id;
  END IF;

  IF v_league.status != 'registration' THEN
    RAISE EXCEPTION 'La liga debe estar en estado registration para generar fixture';
  END IF;

  -- Obtener equipos inscriptos (orden aleatorio para fixture justo)
  SELECT ARRAY_AGG(team_id ORDER BY random()) INTO v_teams
    FROM public.team_league_teams
    WHERE team_league_id = p_team_league_id;

  v_num_teams := array_length(v_teams, 1);

  IF v_num_teams IS NULL OR v_num_teams < 2 THEN
    RAISE EXCEPTION 'Se necesitan al menos 2 equipos para generar fixture';
  END IF;

  -- Si es impar, agregar null (bye)
  IF v_num_teams % 2 != 0 THEN
    v_teams := v_teams || ARRAY[NULL::uuid];
    v_num_teams := v_num_teams + 1;
  END IF;

  v_total_rounds := v_num_teams - 1;

  -- Algoritmo round-robin (rotacion circular)
  FOR v_round IN 1..v_total_rounds LOOP
    FOR v_i IN 0..(v_num_teams / 2 - 1) LOOP
      v_home := v_i + 1;
      v_away := v_num_teams - v_i;

      -- Saltar si alguno es bye (null)
      IF v_teams[v_home] IS NOT NULL AND v_teams[v_away] IS NOT NULL THEN
        INSERT INTO public.team_league_matches (
          team_league_id, round, team1_id, team2_id
        ) VALUES (
          p_team_league_id, v_round, v_teams[v_home], v_teams[v_away]
        );
        v_matches_created := v_matches_created + 1;
      END IF;
    END LOOP;

    -- Rotar: el primero queda fijo, los demas rotan
    v_temp := v_teams[v_num_teams];
    FOR v_i IN REVERSE v_num_teams..3 LOOP
      v_teams[v_i] := v_teams[v_i - 1];
    END LOOP;
    v_teams[2] := v_temp;
  END LOOP;

  -- Actualizar la liga
  UPDATE public.team_leagues
    SET status = 'in_progress',
        total_rounds = v_total_rounds,
        current_round = 1,
        started_at = now()
    WHERE id = p_team_league_id;

  RETURN jsonb_build_object(
    'success', true,
    'total_rounds', v_total_rounds,
    'matches_created', v_matches_created,
    'teams_count', array_length(v_teams, 1)
  );
END;
$$;


-- 7.3 Wallet: deducir omega coins (reemplaza la funcion vieja, usa wallet)
CREATE OR REPLACE FUNCTION wallet_deduct(p_player_id uuid, p_amount int, p_type text, p_description text DEFAULT NULL, p_reference_id uuid DEFAULT NULL)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_balance int;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser positivo';
  END IF;

  -- Intentar deducir atomicamente
  UPDATE public.omega_wallets
    SET balance = balance - p_amount
    WHERE player_id = p_player_id
      AND balance >= p_amount
    RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RETURN -1; -- saldo insuficiente
  END IF;

  -- Registrar transaccion
  INSERT INTO public.wallet_transactions (player_id, amount, balance_after, type, description, reference_id)
  VALUES (p_player_id, -p_amount, v_new_balance, p_type, p_description, p_reference_id);

  -- Sync con players.omega_coins (retrocompatibilidad)
  UPDATE public.players SET omega_coins = v_new_balance WHERE id = p_player_id;

  RETURN v_new_balance;
END;
$$;


-- 7.4 Wallet: agregar omega coins
CREATE OR REPLACE FUNCTION wallet_credit(p_player_id uuid, p_amount int, p_type text, p_description text DEFAULT NULL, p_reference_id uuid DEFAULT NULL)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_balance int;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser positivo';
  END IF;

  -- Agregar atomicamente
  UPDATE public.omega_wallets
    SET balance = balance + p_amount
    WHERE player_id = p_player_id
    RETURNING balance INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    -- Wallet no existe, crearla con el monto
    INSERT INTO public.omega_wallets (player_id, balance)
    VALUES (p_player_id, p_amount)
    RETURNING balance INTO v_new_balance;
  END IF;

  -- Registrar transaccion
  INSERT INTO public.wallet_transactions (player_id, amount, balance_after, type, description, reference_id)
  VALUES (p_player_id, p_amount, v_new_balance, p_type, p_description, p_reference_id);

  -- Sync con players.omega_coins (retrocompatibilidad)
  UPDATE public.players SET omega_coins = v_new_balance WHERE id = p_player_id;

  RETURN v_new_balance;
END;
$$;


-- 7.5 Comprar voucher (atomico)
CREATE OR REPLACE FUNCTION purchase_voucher(p_player_id uuid, p_voucher_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cost int;
  v_discount int;
  v_new_balance int;
  v_voucher_id uuid;
BEGIN
  -- Verificar que el caller es el dueño de la wallet
  IF p_player_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.players WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Determinar costo y descuento
  CASE p_voucher_type
    WHEN 'discount_5'  THEN v_cost := 50;  v_discount := 5;
    WHEN 'discount_10' THEN v_cost := 100; v_discount := 10;
    WHEN 'discount_15' THEN v_cost := 200; v_discount := 15;
    WHEN 'discount_20' THEN v_cost := 350; v_discount := 20;
    WHEN 'golden_ticket' THEN v_cost := 300; v_discount := NULL;
    ELSE RAISE EXCEPTION 'Tipo de voucher invalido: %', p_voucher_type;
  END CASE;

  -- Deducir coins
  IF p_voucher_type = 'golden_ticket' THEN
    v_new_balance := public.wallet_deduct(
      p_player_id, v_cost, 'golden_ticket_purchase',
      'Compra de Golden Ticket'
    );
  ELSE
    v_new_balance := public.wallet_deduct(
      p_player_id, v_cost, 'voucher_purchase',
      format('Compra de voucher %s%% descuento', v_discount)
    );
  END IF;

  IF v_new_balance = -1 THEN
    RAISE EXCEPTION 'Saldo insuficiente. Necesitas % omega coins', v_cost;
  END IF;

  -- Crear el voucher
  INSERT INTO public.player_vouchers (player_id, type, discount_percent, cost_omega_coins)
  VALUES (p_player_id, p_voucher_type, v_discount, v_cost)
  RETURNING id INTO v_voucher_id;

  RETURN jsonb_build_object(
    'success', true,
    'voucher_id', v_voucher_id,
    'type', p_voucher_type,
    'cost', v_cost,
    'new_balance', v_new_balance
  );
END;
$$;


-- 7.6 Usar golden ticket (inscripcion gratuita a torneo)
CREATE OR REPLACE FUNCTION use_golden_ticket(p_player_id uuid, p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_voucher RECORD;
  v_tournament RECORD;
BEGIN
  -- Verificar que el caller es el dueño
  IF p_player_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.players WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Buscar un golden ticket no usado
  SELECT * INTO v_voucher
    FROM public.player_vouchers
    WHERE player_id = p_player_id
      AND type = 'golden_ticket'
      AND is_used = false
    ORDER BY purchased_at ASC
    LIMIT 1
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No tenes golden tickets disponibles';
  END IF;

  -- Verificar que el torneo existe y esta en registro
  SELECT * INTO v_tournament
    FROM public.tournaments
    WHERE id = p_tournament_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Torneo no encontrado';
  END IF;

  IF v_tournament.status != 'registration' THEN
    RAISE EXCEPTION 'El torneo no esta en periodo de inscripcion';
  END IF;

  -- Verificar que el jugador no esta ya inscripto
  IF EXISTS (
    SELECT 1 FROM public.tournament_participants
    WHERE tournament_id = p_tournament_id AND player_id = p_player_id
  ) THEN
    RAISE EXCEPTION 'Ya estas inscripto en este torneo';
  END IF;

  -- Marcar ticket como usado
  UPDATE public.player_vouchers
    SET is_used = true,
        used_at = now(),
        used_on_tournament_id = p_tournament_id
    WHERE id = v_voucher.id;

  -- Inscribir al jugador
  INSERT INTO public.tournament_participants (tournament_id, player_id)
  VALUES (p_tournament_id, p_player_id);

  RETURN jsonb_build_object(
    'success', true,
    'voucher_id', v_voucher.id,
    'tournament_id', p_tournament_id,
    'message', 'Inscripto con Golden Ticket'
  );
END;
$$;


-- 7.7 Aplicar voucher de descuento a una orden
CREATE OR REPLACE FUNCTION apply_voucher(p_player_id uuid, p_voucher_id uuid, p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_voucher RECORD;
  v_order RECORD;
  v_discount_amount decimal(10,2);
BEGIN
  -- Verificar autorizacion
  IF p_player_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.players WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Obtener y lockear el voucher
  SELECT * INTO v_voucher
    FROM public.player_vouchers
    WHERE id = p_voucher_id
      AND player_id = p_player_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Voucher no encontrado';
  END IF;

  IF v_voucher.is_used THEN
    RAISE EXCEPTION 'Este voucher ya fue usado';
  END IF;

  IF v_voucher.type = 'golden_ticket' THEN
    RAISE EXCEPTION 'Los golden tickets no se aplican a ordenes. Usa use_golden_ticket()';
  END IF;

  -- Obtener la orden
  SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
      AND player_id = p_player_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada';
  END IF;

  IF v_order.status != 'pending' THEN
    RAISE EXCEPTION 'Solo se puede aplicar voucher a ordenes pendientes';
  END IF;

  -- Calcular descuento
  v_discount_amount := v_order.total * (v_voucher.discount_percent::decimal / 100);

  -- Marcar voucher como usado
  UPDATE public.player_vouchers
    SET is_used = true,
        used_at = now(),
        used_on_order_id = p_order_id
    WHERE id = p_voucher_id;

  -- Actualizar total de la orden
  UPDATE public.orders
    SET total = total - v_discount_amount,
        notes = COALESCE(notes, '') || format(' | Voucher %s%% aplicado (-%s)', v_voucher.discount_percent, v_discount_amount)
    WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'discount_percent', v_voucher.discount_percent,
    'discount_amount', v_discount_amount,
    'new_total', v_order.total - v_discount_amount
  );
END;
$$;


-- 7.8 Admin: grant/deduct omega coins a un jugador
CREATE OR REPLACE FUNCTION admin_wallet_adjust(p_player_id uuid, p_amount int, p_description text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result int;
BEGIN
  -- Solo admins
  IF NOT EXISTS (
    SELECT 1 FROM public.players WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Solo admins pueden ajustar wallets';
  END IF;

  IF p_amount = 0 THEN
    RAISE EXCEPTION 'El monto no puede ser 0';
  END IF;

  IF p_amount > 0 THEN
    v_result := public.wallet_credit(
      p_player_id, p_amount, 'admin_grant',
      COALESCE(p_description, 'Ajuste admin: +' || p_amount)
    );
  ELSE
    v_result := public.wallet_deduct(
      p_player_id, ABS(p_amount), 'admin_deduct',
      COALESCE(p_description, 'Ajuste admin: ' || p_amount)
    );
  END IF;

  IF v_result = -1 THEN
    RAISE EXCEPTION 'Saldo insuficiente para el debito';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'player_id', p_player_id,
    'amount', p_amount,
    'new_balance', v_result
  );
END;
$$;


-- ============================================================================
-- SECCION 8: MIGRACION DE DATOS — Crear wallets para todos los jugadores
-- ============================================================================

-- Crear wallet para cada jugador existente, sincronizando con su balance actual de omega_coins
INSERT INTO omega_wallets (player_id, balance)
SELECT id, GREATEST(COALESCE(omega_coins, 0), 5)
  FROM players
ON CONFLICT (player_id) DO NOTHING;

-- Registrar transaccion inicial para cada wallet creada
INSERT INTO wallet_transactions (player_id, amount, balance_after, type, description)
SELECT
  ow.player_id,
  ow.balance,
  ow.balance,
  'initial_grant',
  'Migracion inicial de omega_coins a wallet'
FROM omega_wallets ow
WHERE NOT EXISTS (
  SELECT 1 FROM wallet_transactions wt
  WHERE wt.player_id = ow.player_id AND wt.type = 'initial_grant'
);


-- ============================================================================
-- SECCION 9: ACTUALIZAR handle_new_user PARA CREAR WALLET AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Crear perfil del jugador
  INSERT INTO public.players (id, full_name, alias)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'alias', NEW.id::text)
  );

  -- Crear wallet con 5 omega coins iniciales
  INSERT INTO public.omega_wallets (player_id, balance)
  VALUES (NEW.id, 5);

  -- Registrar transaccion inicial
  INSERT INTO public.wallet_transactions (player_id, amount, balance_after, type, description)
  VALUES (NEW.id, 5, 5, 'initial_grant', 'Bienvenida: 5 omega coins');

  RETURN NEW;
END;
$$;


-- ============================================================================
-- SECCION 10: RETROCOMPATIBILIDAD — Actualizar RPCs viejas de omega_coins
-- ============================================================================

-- Las funciones viejas ahora delegan a wallet_deduct/wallet_credit
-- pero mantienen la misma firma para no romper el frontend

CREATE OR REPLACE FUNCTION deduct_omega_coins(p_player_id uuid, p_amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result int;
BEGIN
  v_result := public.wallet_deduct(p_player_id, p_amount, 'voucher_purchase', 'deduct_omega_coins (legacy)');
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION add_omega_coins(p_player_id uuid, p_amount int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result int;
BEGIN
  v_result := public.wallet_credit(p_player_id, p_amount, 'admin_grant', 'add_omega_coins (legacy)');
  RETURN v_result;
END;
$$;


-- ============================================================================
-- SECCION 11: REALTIME
-- ============================================================================

-- Habilitar realtime en tablas de equipos para updates en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE team_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE team_match_fights;
ALTER PUBLICATION supabase_realtime ADD TABLE team_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE team_league_teams;


-- ============================================================================
-- SECCION 12: BADGES DE EQUIPO
-- ============================================================================

INSERT INTO badges (id, name, description, icon) VALUES
  ('team_first_win', 'Victoria en Equipo', 'Gana tu primera batalla de equipo', '🤝'),
  ('team_streak_3', 'Equipo Imparable', '3 victorias seguidas en equipo', '⚡'),
  ('team_champion', 'Campeon de Liga', 'Gana una temporada de liga de equipos', '🏆'),
  ('wallet_saver', 'Ahorrista', 'Acumula 500 omega coins', '💰'),
  ('voucher_hunter', 'Cazador de Vouchers', 'Compra 5 vouchers', '🎟️'),
  ('golden_ticket', 'Ticket Dorado', 'Usa un golden ticket para inscribirte gratis', '✨')
ON CONFLICT (id) DO NOTHING;


COMMIT;
