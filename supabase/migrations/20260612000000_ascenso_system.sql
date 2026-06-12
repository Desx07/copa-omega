-- ============================================================================
-- COPA OMEGA STAR — Sistema de Ascenso
-- Migration: 20260612000000_ascenso_system.sql
--
-- Peleas 1v1 donde el ganador acumula puntos de ticket. Ticket lleno habilita
-- un combate de ascenso entre dos jugadores del mismo rango: el ganador sube
-- de rango (F → E → D → C → B → A → S) y ambos reinician su ticket.
-- En modo ascenso NO se apuestan ni transfieren estrellas.
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. PLAYERS: rango y puntos de ticket
-- ────────────────────────────────────────────

ALTER TABLE players ADD COLUMN IF NOT EXISTS rank_letter text NOT NULL DEFAULT 'F';
ALTER TABLE players ADD COLUMN IF NOT EXISTS ticket_points int NOT NULL DEFAULT 0;

ALTER TABLE players DROP CONSTRAINT IF EXISTS players_rank_letter_check;
ALTER TABLE players ADD CONSTRAINT players_rank_letter_check
  CHECK (rank_letter IN ('F', 'E', 'D', 'C', 'B', 'A', 'S'));

ALTER TABLE players DROP CONSTRAINT IF EXISTS players_ticket_points_check;
ALTER TABLE players ADD CONSTRAINT players_ticket_points_check
  CHECK (ticket_points >= 0);

-- ────────────────────────────────────────────
-- 2. MATCHES: modo, tipo de combate y puntos otorgados
-- ────────────────────────────────────────────

ALTER TABLE matches ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'copa_omega';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_kind text NOT NULL DEFAULT 'normal';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS points_awarded int;

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_mode_check;
ALTER TABLE matches ADD CONSTRAINT matches_mode_check
  CHECK (mode IN ('copa_omega', 'ascenso'));

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_match_kind_check;
ALTER TABLE matches ADD CONSTRAINT matches_match_kind_check
  CHECK (match_kind IN ('normal', 'ascension'));

ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_points_awarded_check;
ALTER TABLE matches ADD CONSTRAINT matches_points_awarded_check
  CHECK (points_awarded IS NULL OR points_awarded > 0);

-- Coherencia: solo los matches de modo ascenso pueden ser combates de ascensión
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_ascension_requires_ascenso_check;
ALTER TABLE matches ADD CONSTRAINT matches_ascension_requires_ascenso_check
  CHECK (match_kind = 'normal' OR mode = 'ascenso');

-- stars_bet ya permite 0 desde 20260404000000_allow_zero_stars_bet (CHECK 0-5).
-- Le agregamos DEFAULT 0 para que los inserts de matches de ascenso puedan
-- omitirlo sin romper el NOT NULL ni los matches existentes de copa.
ALTER TABLE matches ALTER COLUMN stars_bet SET DEFAULT 0;

-- Índice parcial: listados y resolución de matches de ascenso por estado
CREATE INDEX IF NOT EXISTS idx_matches_ascenso_mode_status
  ON matches (mode, status)
  WHERE mode = 'ascenso';

-- ────────────────────────────────────────────
-- 3. ASCENSO_RANKS: tabla de configuración de rangos
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ascenso_ranks (
  letter text PRIMARY KEY CHECK (letter IN ('F', 'E', 'D', 'C', 'B', 'A', 'S')),
  name text NOT NULL,
  -- Puntos de ticket necesarios para habilitar el combate de ascenso.
  -- NULL solo para 'S' (rango máximo, no se asciende más).
  ticket_target int CHECK (ticket_target IS NULL OR ticket_target > 0),
  sort int NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed idempotente (re-ejecutable: converge a estos valores)
INSERT INTO ascenso_ranks (letter, name, ticket_target, sort) VALUES
  ('F', 'Novato',   100,  0),
  ('E', 'Hierro',   150,  1),
  ('D', 'Bronce',   200,  2),
  ('C', 'Plata',    300,  3),
  ('B', 'Oro',      400,  4),
  ('A', 'Diamante', 500,  5),
  ('S', 'Omega',    NULL, 6)
ON CONFLICT (letter) DO UPDATE
  SET name = EXCLUDED.name,
      ticket_target = EXCLUDED.ticket_target,
      sort = EXCLUDED.sort,
      updated_at = now();

-- RLS: lectura para todos los autenticados (igual que las demás tablas de config)
ALTER TABLE ascenso_ranks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ascenso_ranks_select_all" ON ascenso_ranks;
CREATE POLICY "ascenso_ranks_select_all"
  ON ascenso_ranks FOR SELECT
  TO authenticated
  USING (true);

-- Sin policies de INSERT/UPDATE/DELETE: solo se modifica vía migraciones.

-- ────────────────────────────────────────────
-- 4. RPC: resolve_ascenso_match (admin/juez)
-- ────────────────────────────────────────────
-- Mismo patrón de permisos que resolve_match (post 20260321000000):
-- solo admin o juez, acepta matches 'pending' o 'in_progress'.
--
-- A diferencia de copa omega (donde la API hace feed/XP después del RPC),
-- acá los side effects de activity_feed y XP van DENTRO del RPC para que
-- todo sea atómico. La API de ascenso NO debe duplicar feed ni XP;
-- las push notifications sí quedan a cargo de la API (como en copa).

CREATE OR REPLACE FUNCTION public.resolve_ascenso_match(p_match_id uuid, p_winner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match RECORD;
  v_loser_id uuid;
  v_winner RECORD;
  v_loser RECORD;
  v_rank RECORD;
  v_next_letter text;
BEGIN
  -- Verificar que el caller sea admin o juez
  IF NOT EXISTS (
    SELECT 1 FROM public.players
    WHERE id = auth.uid()
      AND (is_admin = true OR is_judge = true)
  ) THEN
    RAISE EXCEPTION 'Only admins or judges can resolve matches';
  END IF;

  -- Traer el match y lockear la fila
  SELECT * INTO v_match
    FROM public.matches
    WHERE id = p_match_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found: %', p_match_id;
  END IF;

  IF v_match.status NOT IN ('pending', 'in_progress') THEN
    RAISE EXCEPTION 'Match must be pending or in_progress to resolve (current status: %)', v_match.status;
  END IF;

  IF v_match.mode != 'ascenso' THEN
    RAISE EXCEPTION 'Match % is not an ascenso match (mode: %)', p_match_id, v_match.mode;
  END IF;

  -- Validar que el ganador sea uno de los dos jugadores
  IF p_winner_id != v_match.player1_id AND p_winner_id != v_match.player2_id THEN
    RAISE EXCEPTION 'Winner must be one of the match participants';
  END IF;

  -- Determinar el perdedor
  IF p_winner_id = v_match.player1_id THEN
    v_loser_id := v_match.player2_id;
  ELSE
    v_loser_id := v_match.player1_id;
  END IF;

  -- Lockear ambos jugadores en orden determinístico (evita deadlocks)
  PERFORM 1 FROM public.players
    WHERE id IN (v_match.player1_id, v_match.player2_id)
    ORDER BY id
    FOR UPDATE;

  SELECT rank_letter, ticket_points INTO v_winner
    FROM public.players WHERE id = p_winner_id;
  SELECT rank_letter, ticket_points INTO v_loser
    FROM public.players WHERE id = v_loser_id;

  IF v_match.match_kind = 'normal' THEN
    ------------------------------------------------------------------
    -- COMBATE NORMAL: el ganador suma puntos de ticket (sin tope;
    -- la UI muestra "lleno" cuando ticket_points >= ticket_target).
    -- NO se transfieren estrellas.
    ------------------------------------------------------------------
    IF v_match.points_awarded IS NULL THEN
      RAISE EXCEPTION 'points_awarded is required for normal ascenso matches';
    END IF;

    UPDATE public.players
      SET ticket_points = ticket_points + v_match.points_awarded,
          wins = wins + 1
      WHERE id = p_winner_id;

    UPDATE public.players
      SET losses = losses + 1
      WHERE id = v_loser_id;

    -- Feed: resultado de batalla de ascenso
    INSERT INTO public.activity_feed (type, actor_id, target_id, reference_id, metadata)
    VALUES (
      'match_result',
      p_winner_id,
      v_loser_id,
      p_match_id,
      jsonb_build_object(
        'mode', 'ascenso',
        'match_kind', 'normal',
        'points_awarded', v_match.points_awarded,
        'rank_letter', v_winner.rank_letter
      )
    );

    -- XP: mismos montos que un match de copa (20 ganador / 5 perdedor)
    UPDATE public.players SET xp = xp + 20 WHERE id = p_winner_id;
    UPDATE public.players SET xp = xp + 5 WHERE id = v_loser_id;
    INSERT INTO public.xp_transactions (player_id, amount, source, description) VALUES
      (p_winner_id, 20, 'win_ascenso_match', 'Victoria en batalla de ascenso'),
      (v_loser_id, 5, 'lose_ascenso_match', 'Derrota en batalla de ascenso');

  ELSIF v_match.match_kind = 'ascension' THEN
    ------------------------------------------------------------------
    -- COMBATE DE ASCENSO: ambos del mismo rango con ticket lleno.
    -- Ganador sube de rango, ambos reinician ticket.
    ------------------------------------------------------------------
    IF v_winner.rank_letter != v_loser.rank_letter THEN
      RAISE EXCEPTION 'Both players must have the same rank for an ascension match (% vs %)',
        v_winner.rank_letter, v_loser.rank_letter;
    END IF;

    IF v_winner.rank_letter = 'S' THEN
      RAISE EXCEPTION 'Rank S is the maximum rank, cannot ascend further';
    END IF;

    SELECT * INTO v_rank
      FROM public.ascenso_ranks
      WHERE letter = v_winner.rank_letter;

    IF NOT FOUND OR v_rank.ticket_target IS NULL THEN
      RAISE EXCEPTION 'No ticket target configured for rank %', v_winner.rank_letter;
    END IF;

    IF v_winner.ticket_points < v_rank.ticket_target
       OR v_loser.ticket_points < v_rank.ticket_target THEN
      RAISE EXCEPTION 'Both players need a full ticket (% points) to fight an ascension match',
        v_rank.ticket_target;
    END IF;

    SELECT letter INTO v_next_letter
      FROM public.ascenso_ranks
      WHERE sort = v_rank.sort + 1;

    IF v_next_letter IS NULL THEN
      RAISE EXCEPTION 'No next rank configured above %', v_winner.rank_letter;
    END IF;

    -- Ganador: sube de rango y reinicia ticket
    UPDATE public.players
      SET rank_letter = v_next_letter,
          ticket_points = 0,
          wins = wins + 1
      WHERE id = p_winner_id;

    -- Perdedor: mantiene rango pero reinicia ticket
    UPDATE public.players
      SET ticket_points = 0,
          losses = losses + 1
      WHERE id = v_loser_id;

    -- Feed: cambio de rango (tipo ya permitido por el CHECK de activity_feed)
    INSERT INTO public.activity_feed (type, actor_id, target_id, reference_id, metadata)
    VALUES (
      'rank_change',
      p_winner_id,
      v_loser_id,
      p_match_id,
      jsonb_build_object(
        'event', 'ascension_battle',
        'mode', 'ascenso',
        'from_rank', v_winner.rank_letter,
        'to_rank', v_next_letter
      )
    );

    -- XP: el combate de ascenso vale más que uno normal
    UPDATE public.players SET xp = xp + 50 WHERE id = p_winner_id;
    UPDATE public.players SET xp = xp + 10 WHERE id = v_loser_id;
    INSERT INTO public.xp_transactions (player_id, amount, source, description) VALUES
      (p_winner_id, 50, 'win_ascension', 'Victoria en combate de ascenso'),
      (v_loser_id, 10, 'lose_ascension', 'Derrota en combate de ascenso');

  ELSE
    RAISE EXCEPTION 'Unknown match_kind: %', v_match.match_kind;
  END IF;

  -- Cerrar el match (sin transferencia de estrellas en modo ascenso)
  UPDATE public.matches
    SET status = 'completed',
        winner_id = p_winner_id,
        completed_at = now()
    WHERE id = p_match_id;
END;
$$;

-- ============================================================================
-- ROLLBACK MANUAL (referencia — NO ejecutar como parte de la migración):
--
--   DROP FUNCTION IF EXISTS public.resolve_ascenso_match(uuid, uuid);
--   DROP TABLE IF EXISTS ascenso_ranks;
--   DROP INDEX IF EXISTS idx_matches_ascenso_mode_status;
--   ALTER TABLE matches ALTER COLUMN stars_bet DROP DEFAULT;
--   ALTER TABLE matches
--     DROP CONSTRAINT IF EXISTS matches_ascension_requires_ascenso_check,
--     DROP CONSTRAINT IF EXISTS matches_points_awarded_check,
--     DROP CONSTRAINT IF EXISTS matches_match_kind_check,
--     DROP CONSTRAINT IF EXISTS matches_mode_check,
--     DROP COLUMN IF EXISTS points_awarded,
--     DROP COLUMN IF EXISTS match_kind,
--     DROP COLUMN IF EXISTS mode;
--   ALTER TABLE players
--     DROP CONSTRAINT IF EXISTS players_ticket_points_check,
--     DROP CONSTRAINT IF EXISTS players_rank_letter_check,
--     DROP COLUMN IF EXISTS ticket_points,
--     DROP COLUMN IF EXISTS rank_letter;
-- ============================================================================
