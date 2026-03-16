-- Add check-in support to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS checkin_open boolean NOT NULL DEFAULT false;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS checkin_deadline timestamptz;

-- Add checked_in to tournament_participants
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS checked_in boolean NOT NULL DEFAULT false;
ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
