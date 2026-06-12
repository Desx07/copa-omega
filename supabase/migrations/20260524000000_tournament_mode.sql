-- Modalidades de torneo: activación independiente + landing destacada.
-- Cada modalidad se prende/apaga por separado (pueden convivir varias activas).
-- 'landing_featured' define cuál ocupa la landing pública (una sola).
-- Idempotente y no destructiva. Default: solo Copa Omega activa y destacada.
INSERT INTO app_settings (key, value) VALUES
  ('mode_copa_omega_enabled', 'true'),
  ('mode_ascenso_enabled', 'false'),
  ('mode_liga_enabled', 'false'),
  ('landing_featured', 'copa_omega')
ON CONFLICT (key) DO NOTHING;
