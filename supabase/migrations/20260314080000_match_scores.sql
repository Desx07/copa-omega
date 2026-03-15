-- Add score columns to the star battles matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player1_score int DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player2_score int DEFAULT 0;
