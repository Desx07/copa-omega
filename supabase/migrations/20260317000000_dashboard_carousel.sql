-- Separate dashboard carousel from landing carousel
ALTER TABLE carousel_items ADD COLUMN IF NOT EXISTS target text NOT NULL DEFAULT 'landing'
  CHECK (target IN ('landing', 'dashboard'));

-- Existing items are all for landing
UPDATE carousel_items SET target = 'landing' WHERE target IS NULL OR target = 'landing';

-- Dashboard carousel toggle (separate from landing)
INSERT INTO app_settings (key, value)
VALUES ('dashboard_carousel_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
