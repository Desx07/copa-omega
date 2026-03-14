-- Store toggle: admin can enable/disable the entire store
CREATE TABLE IF NOT EXISTS app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_settings (key, value) VALUES ('store_enabled', 'true')
  ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select_all" ON app_settings FOR SELECT USING (true);
CREATE POLICY "settings_update_admin" ON app_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
