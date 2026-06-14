-- ============================================================================
-- COPA OMEGA STAR — Habilitación de jugadores para el Torneo de Ascenso
-- Migration: 20260613000000_ascenso_enabled.sql
--
-- En Copa Omega toda cuenta arrancaba con 25 estrellas; muchos nunca jugaron
-- ni pagaron y ensuciaban el ranking. Para el Torneo de Ascenso, SOLO los
-- jugadores que el admin habilita (porque pagaron / van a jugar) pueden sumar
-- puntos de ticket, pelear combates de ascenso y aparecer en el ranking.
--
-- Esta migración:
--   1. Agrega players.ascenso_enabled (default false, solo admin lo cambia).
--   2. Redefine resolve_ascenso_match para validar ascenso_enabled antes de
--      sumar puntos / procesar el combate (defensa de fondo en la DB).
--   3. Extiende players_update_own (WITH CHECK) para que el jugador NO pueda
--      auto-editar ascenso_enabled.
--
-- Idempotente: re-ejecutable sin efectos colaterales.
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. PLAYERS: flag de habilitación para ascenso
-- ────────────────────────────────────────────

-- Habilitado por el admin para participar del Torneo de Ascenso.
-- Default false: nadie participa hasta que el admin lo habilite explícitamente.
ALTER TABLE players ADD COLUMN IF NOT EXISTS ascenso_enabled boolean NOT NULL DEFAULT false;

-- ────────────────────────────────────────────
-- 2. RPC: resolve_ascenso_match con validación de habilitación
-- ────────────────────────────────────────────
-- Copia EXACTA de la definición de 20260612000000_ascenso_system.sql,
-- agregando un chequeo de ascenso_enabled para ambos jugadores justo después
-- de traer winner/loser. Si alguno no está habilitado, se aborta toda la
-- transacción (RAISE EXCEPTION). Esto evita que un no-habilitado sume puntos
-- de ticket o pelee un combate de ascenso, incluso si la API fuera evadida.

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

  SELECT rank_letter, ticket_points, ascenso_enabled INTO v_winner
    FROM public.players WHERE id = p_winner_id;
  SELECT rank_letter, ticket_points, ascenso_enabled INTO v_loser
    FROM public.players WHERE id = v_loser_id;

  -- Ambos jugadores deben estar habilitados por el admin para el Torneo de
  -- Ascenso. Sin esto un no-habilitado podría sumar puntos / subir de rango.
  IF v_winner.ascenso_enabled IS NOT TRUE OR v_loser.ascenso_enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'El jugador no está habilitado para el torneo de ascenso';
  END IF;

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

-- ────────────────────────────────────────────
-- 3. RLS: players_update_own debe proteger ascenso_enabled
-- ────────────────────────────────────────────
-- Se recrea la policy de 20260612000000 agregando ascenso_enabled a la lista
-- de columnas que el jugador NO puede modificar en su propio UPDATE. Solo el
-- admin (vía service role en /api/admin/players/[id]/ascenso) la cambia.

DROP POLICY IF EXISTS players_update_own ON players;

CREATE POLICY players_update_own ON players
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND stars = (SELECT p.stars FROM players p WHERE p.id = auth.uid())
    AND wins = (SELECT p.wins FROM players p WHERE p.id = auth.uid())
    AND losses = (SELECT p.losses FROM players p WHERE p.id = auth.uid())
    AND is_admin = (SELECT p.is_admin FROM players p WHERE p.id = auth.uid())
    AND is_eliminated = (SELECT p.is_eliminated FROM players p WHERE p.id = auth.uid())
    AND rank_letter = (SELECT p.rank_letter FROM players p WHERE p.id = auth.uid())
    AND ticket_points = (SELECT p.ticket_points FROM players p WHERE p.id = auth.uid())
    AND ascenso_enabled = (SELECT p.ascenso_enabled FROM players p WHERE p.id = auth.uid())
  );

-- ============================================================================
-- ROLLBACK MANUAL (referencia — NO ejecutar como parte de la migración):
--
--   -- resolve_ascenso_match: re-ejecutar la definición de
--   --   20260612000000_ascenso_system.sql (sin el chequeo de ascenso_enabled)
--   -- players_update_own: re-ejecutar la policy de
--   --   20260612000000_ascenso_system.sql (sin la línea de ascenso_enabled)
--   ALTER TABLE players DROP COLUMN IF EXISTS ascenso_enabled;
-- ============================================================================
