-- Podium card images per tournament badge
ALTER TABLE tournament_badges ADD COLUMN IF NOT EXISTS card_image_url text;

-- Player profile card (ficha de perfil — the fixed one, not per-tournament)
ALTER TABLE players ADD COLUMN IF NOT EXISTS profile_card_url text;

-- Swiss rounds: configurable number of rounds instead of auto-calculated
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS swiss_rounds int;
