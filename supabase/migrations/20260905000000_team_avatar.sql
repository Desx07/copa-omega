-- Migración: foto de perfil (logo) de equipos
--
-- NOTA IMPORTANTE (verificado contra el schema real):
-- La tabla de equipos es `teams` y YA tiene la columna `logo_url text`
-- (creada en 20260405000000_teams_league_wallet.sql), usada en toda la app
-- para mostrar el logo del equipo. La feature de "foto de perfil del equipo"
-- se implementa REUSANDO esa columna existente, NO agregando una nueva
-- `avatar_url` (que quedaría duplicada y desincronizada del display).
--
-- Esta migración es idempotente y no destructiva: se limita a garantizar que
-- la columna exista (no-op en la DB actual, donde ya está presente). Se deja
-- registrada para dejar explícito que el logo del equipo vive en `teams.logo_url`.

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS logo_url text;

COMMENT ON COLUMN teams.logo_url IS
  'URL pública del logo/foto de perfil del equipo (bucket avatars, path teams/<teamId>.jpg). Se muestra redondo en la UI.';
