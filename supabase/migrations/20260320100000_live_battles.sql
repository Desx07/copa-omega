-- Add live flag to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_live boolean NOT NULL DEFAULT false;

-- Enable realtime for matches
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
