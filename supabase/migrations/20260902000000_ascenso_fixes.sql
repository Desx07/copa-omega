-- ============================================================================
-- COPA OMEGA STAR — Fixes del Sistema de Ascenso (revisión Claude + agy)
-- Migration: 20260902000000_ascenso_fixes.sql
--
-- Redefine resolve_ascenso_match corrigiendo dos cosas de la revisión previa a
-- activar el torneo con jugadores reales:
--
--   FIX 1 (integridad): las peleas NORMALES suman 10 puntos de ticket FIJOS
--     (POINTS_PER_WIN en lib/ascenso.ts), NO v_match.points_awarded. Antes el
--     RPC confiaba en el valor cargado por la API/juez; ahora el valor está
--     blindado en la DB (defensa en profundidad). Un juez ya no puede inflar
--     el ticket cargando cualquier número.
--
--   FIX 2 (limpieza): rango S es el máximo. En peleas normales, un jugador S
--     ya NO acumula ticket_points (no hay ascenso posible). Igual cuenta la
--     victoria, XP y feed.
--
-- NO cambia el bloque de combate de ascenso (match_kind='ascension'): estaba
-- correcto. NO agrega cancelación/rollback porque ya existen herramientas:
-- DELETE /api/matches/[id] (destraba un match pendiente, p.ej. si se
-- deshabilitó a un jugador) y PATCH /api/admin/players/[id]/rank (corrección
-- manual de rango por el admin si un combate se cargó mal).
--
-- Idempotente (CREATE OR REPLACE). NO se aplica en automático: la corre Ariel
-- con `npx supabase db push`, junto con las migraciones de ascenso pendientes.
-- ============================================================================

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
  v_norm_pts int;  -- FIX 1: puntos fijos de una pelea normal (10, o 0 si el ganador es S)
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

  -- Ambos jugadores deben estar habilitados por el admin para el Torneo de Ascenso.
  IF v_winner.ascenso_enabled IS NOT TRUE OR v_loser.ascenso_enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'El jugador no está habilitado para el torneo de ascenso';
  END IF;

  IF v_match.match_kind = 'normal' THEN
    ------------------------------------------------------------------
    -- COMBATE NORMAL: el ganador suma 10 puntos de ticket FIJOS
    -- (FIX 1 — se ignora v_match.points_awarded a propósito). Rango S es
    -- el máximo y NO acumula ticket (FIX 2). NO se transfieren estrellas.
    ------------------------------------------------------------------
    v_norm_pts := CASE WHEN v_winner.rank_letter = 'S' THEN 0 ELSE 10 END;

    UPDATE public.players
      SET ticket_points = ticket_points + v_norm_pts,
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
        'points_awarded', v_norm_pts,
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
    -- Ganador sube de rango, ambos reinician ticket. (sin cambios)
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

    -- Feed: cambio de rango
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
-- NOTA para cuando se aplique (Ariel, con `npx supabase db push`):
--   Esta migración va DESPUÉS de 20260612000000 (ascenso) y 20260613000000
--   (ascenso_enabled), que deben aplicarse primero. Sin ellas, `public.players`
--   no tiene rank_letter/ticket_points/ascenso_enabled y esto falla.
-- ============================================================================
