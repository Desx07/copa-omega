-- Add event_date for manual tournament ordering
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS event_date date;

-- Default existing tournaments' event_date to their created_at date
UPDATE tournaments SET event_date = DATE(created_at) WHERE event_date IS NULL;
