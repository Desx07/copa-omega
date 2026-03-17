-- Track onboarding completion for new players
ALTER TABLE players ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
