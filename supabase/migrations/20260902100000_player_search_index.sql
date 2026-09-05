-- ============================================================================
-- COPA OMEGA STAR — Índice de búsqueda de jugadores (trigram)
-- Migration: 20260902100000_player_search_index.sql
--
-- El buscador de jugadores (invitar a equipo, etc.) usa
--   alias ILIKE '%texto%' OR full_name ILIKE '%texto%'
-- Un ILIKE con comodín al principio NO usa índice B-tree → full table scan.
-- Con muchas cuentas registradas la búsqueda tardaba ~3 segundos y parecía
-- que "no traía nada". Con índices GIN trigram el ILIKE '%...%' usa índice y
-- responde en milisegundos.
--
-- Idempotente. NO se aplica en automático: la corre Ariel con `db push`.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_players_alias_trgm
  ON players USING gin (alias gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_players_full_name_trgm
  ON players USING gin (full_name gin_trgm_ops);
