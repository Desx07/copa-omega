-- Modalidad de torneo activa (switch de admin)
-- Valores: 'copa_omega' | 'ascenso' | 'liga'. Default copa_omega.
-- Idempotente y no destructiva: si la fila ya existe, no la pisa.
INSERT INTO app_settings (key, value) VALUES ('tournament_mode', 'copa_omega')
  ON CONFLICT (key) DO NOTHING;
