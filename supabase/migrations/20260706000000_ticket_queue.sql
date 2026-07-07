-- ============================================================================
-- COPA OMEGA STAR — Cola de combate por orden de llegada (FIFO)
-- Migration: 20260706000000_ticket_queue.sql
--
-- En el Torneo de Ascenso el emparejamiento del combate NO depende de quién
-- tiene más puntos, sino del ORDEN EN QUE LOS JUGADORES COMPLETARON EL TICKET
-- de su rango: el que llenó primero, pelea primero (cola FIFO).
--
-- Para eso registramos players.ticket_filled_at: el momento exacto en que el
-- jugador cruzó el umbral (ticket_target) de su rango actual. El RPC de
-- resolución de peleas se encarga de fijarlo (al cruzar el umbral) y de
-- reiniciarlo (al ascender de rango, donde arranca de nuevo la cola).
--
-- Idempotente: re-ejecutable sin efectos colaterales.
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. PLAYERS: momento de llenado del ticket (orden de llegada FIFO)
-- ────────────────────────────────────────────

-- Momento en que el jugador completó el ticket de su rango actual; NULL si no
-- está lleno. Define el orden de llegada FIFO para el combate de ascenso.
ALTER TABLE players ADD COLUMN IF NOT EXISTS ticket_filled_at timestamptz;

-- ────────────────────────────────────────────
-- 2. RPC: resolve_ascenso_match con marca de orden de llegada
-- ────────────────────────────────────────────
-- Copia EXACTA de la definición vigente de 20260613000000_ascenso_enabled.sql
-- (con validación de ascenso_enabled), agregando el manejo de ticket_filled_at:
--   a) En 'normal': si el ganador RECIÉN cruza el umbral del ticket, se le fija
--      ticket_filled_at = now(). Si ya estaba lleno de antes, NO se pisa.
--   b) En 'ascension': al reiniciar ticket_points de ambos, también se reinicia
--      ticket_filled_at = NULL (arrancan de nuevo la cola en el rango nuevo).
-- El resto queda idéntico (permisos, validaciones, XP, feed).

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
  v_target int;
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

  SELECT rank_letter, ticket_points, ascenso_enabled, ticket_filled_at INTO v_winner
    FROM public.players WHERE id = p_winner_id;
  SELECT rank_letter, ticket_points, ascenso_enabled, ticket_filled_at INTO v_loser
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

    -- Orden de llegada (FIFO): si con estos puntos el ganador RECIÉN completó
    -- el ticket de su rango (ticket_points ANTES < target y DESPUÉS >= target)
    -- y todavía no tenía marca de llenado, registramos el momento. Ese timestamp
    -- define su lugar en la cola de combate de ascenso. Si ya estaba lleno de
    -- antes, el guard ticket_filled_at IS NULL evita pisar el original.
    SELECT ticket_target INTO v_target
      FROM public.ascenso_ranks
      WHERE letter = v_winner.rank_letter;

    IF v_target IS NOT NULL
       AND v_winner.ticket_points < v_target
       AND v_winner.ticket_points + v_match.points_awarded >= v_target THEN
      UPDATE public.players
        SET ticket_filled_at = now()
        WHERE id = p_winner_id
          AND ticket_filled_at IS NULL;
    END IF;

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

    -- Ganador: sube de rango y reinicia ticket (y su lugar en la cola FIFO)
    UPDATE public.players
      SET rank_letter = v_next_letter,
          ticket_points = 0,
          ticket_filled_at = NULL,
          wins = wins + 1
      WHERE id = p_winner_id;

    -- Perdedor: mantiene rango pero reinicia ticket (y su lugar en la cola FIFO)
    UPDATE public.players
      SET ticket_points = 0,
          ticket_filled_at = NULL,
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
--   -- resolve_ascenso_match: re-ejecutar la definición de
--   --   20260613000000_ascenso_enabled.sql (sin el manejo de ticket_filled_at)
--   ALTER TABLE players DROP COLUMN IF EXISTS ticket_filled_at;
-- ============================================================================
