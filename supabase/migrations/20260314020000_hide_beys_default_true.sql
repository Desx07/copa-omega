-- Default hide_beys to true for new players (beys private by default)
ALTER TABLE players ALTER COLUMN hide_beys SET DEFAULT true;
