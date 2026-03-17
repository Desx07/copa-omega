-- Add sort_order for manual tournament ordering in admin
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

-- Initialize sort_order from event_date (most recent = lowest number = appears first)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(event_date, DATE(created_at)) DESC) as rn
  FROM tournaments
)
UPDATE tournaments SET sort_order = ranked.rn FROM ranked WHERE tournaments.id = ranked.id;
