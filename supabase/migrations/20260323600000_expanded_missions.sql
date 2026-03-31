-- ============================================================================
-- COPA OMEGA STAR — Expanded Missions + Achievements System
-- Daily missions (rotacion diaria) + logros permanentes
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. DAILY MISSIONS (definiciones)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'win_battle', 'use_bey_type', 'challenge_stronger',
    'check_in', 'feed_beypet', 'gacha_pull',
    'win_3v3', 'vote_prediction', 'share_combo', 'win_battles_multiple'
  )),
  target_value int NOT NULL DEFAULT 1,
  reward_oc int NOT NULL DEFAULT 0,
  reward_xp int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────
-- 2. PLAYER DAILY MISSIONS (progreso por jugador)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_daily_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES daily_missions(id) ON DELETE CASCADE,
  progress int NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  claimed boolean NOT NULL DEFAULT false,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamptz,
  UNIQUE(player_id, mission_id, assigned_date)
);

CREATE INDEX IF NOT EXISTS idx_pdm_player_date ON player_daily_missions(player_id, assigned_date);
CREATE INDEX IF NOT EXISTS idx_pdm_mission ON player_daily_missions(mission_id);

-- ────────────────────────────────────────────
-- 3. ACHIEVEMENTS (definiciones)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Trophy',
  category text NOT NULL CHECK (category IN ('combat', 'social', 'collector', 'tournament', 'special')),
  requirement_type text NOT NULL,
  requirement_value int NOT NULL DEFAULT 1,
  reward_oc int NOT NULL DEFAULT 0,
  reward_xp int NOT NULL DEFAULT 0,
  reward_badge text,
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

-- ────────────────────────────────────────────
-- 4. PLAYER ACHIEVEMENTS (desbloqueos)
-- ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS player_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_pa_player ON player_achievements(player_id);
CREATE INDEX IF NOT EXISTS idx_pa_achievement ON player_achievements(achievement_id);

-- ────────────────────────────────────────────
-- 5. RLS — daily_missions
-- ────────────────────────────────────────────

ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_select_all" ON daily_missions
  FOR SELECT USING (true);

CREATE POLICY "dm_insert_admin" ON daily_missions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "dm_update_admin" ON daily_missions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ────────────────────────────────────────────
-- 6. RLS — player_daily_missions
-- ────────────────────────────────────────────

ALTER TABLE player_daily_missions ENABLE ROW LEVEL SECURITY;

-- Jugador puede leer sus propias misiones
CREATE POLICY "pdm_select_own" ON player_daily_missions
  FOR SELECT TO authenticated
  USING (player_id = auth.uid());

-- Jugador puede insertar sus propias asignaciones
CREATE POLICY "pdm_insert_own" ON player_daily_missions
  FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());

-- Jugador puede actualizar sus propias misiones (progreso, claimed)
CREATE POLICY "pdm_update_own" ON player_daily_missions
  FOR UPDATE TO authenticated
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

-- Admin puede leer todas
CREATE POLICY "pdm_select_admin" ON player_daily_missions
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ────────────────────────────────────────────
-- 7. RLS — achievements
-- ────────────────────────────────────────────

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ach_select_all" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "ach_insert_admin" ON achievements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ────────────────────────────────────────────
-- 8. RLS — player_achievements
-- ────────────────────────────────────────────

ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver logros desbloqueados (son publicos)
CREATE POLICY "pa_select_all" ON player_achievements
  FOR SELECT USING (true);

-- Solo el sistema (admin client) puede insertar, pero para RLS
-- el jugador puede insertar su propia fila como fallback
CREATE POLICY "pa_insert_own" ON player_achievements
  FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());

-- ────────────────────────────────────────────
-- 9. SEED — 10 daily missions
-- ────────────────────────────────────────────

INSERT INTO daily_missions (description, type, target_value, reward_oc, reward_xp) VALUES
  ('Gana una batalla', 'win_battle', 1, 10, 5),
  ('Gana 3 batallas', 'win_battles_multiple', 3, 30, 15),
  ('Usa un beyblade tipo Stamina', 'use_bey_type', 1, 15, 5),
  ('Reta a alguien con mas estrellas', 'challenge_stronger', 1, 20, 10),
  ('Alimenta tu BeyPet', 'feed_beypet', 1, 5, 3),
  ('Hace una tirada Gacha', 'gacha_pull', 1, 10, 5),
  ('Gana un reto 3v3', 'win_3v3', 1, 25, 10),
  ('Hace check-in QR', 'check_in', 1, 10, 5),
  ('Vota en una prediccion', 'vote_prediction', 1, 5, 3),
  ('Comparti un combo', 'share_combo', 1, 10, 5);

-- ────────────────────────────────────────────
-- 10. SEED — 20 achievements
-- ────────────────────────────────────────────

-- Combat (5)
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, reward_oc, reward_xp, rarity) VALUES
  ('Primera Sangre', 'Gana tu primera batalla', 'Swords', 'combat', 'total_wins', 1, 10, 10, 'common'),
  ('Pentakill', 'Gana 5 batallas en un dia', 'Flame', 'combat', 'wins_in_day', 5, 50, 30, 'rare'),
  ('Invicto', 'Gana 10 batallas seguidas', 'Shield', 'combat', 'win_streak', 10, 100, 50, 'epic'),
  ('Gigante Killer', 'Vence al #1 del ranking', 'Crown', 'combat', 'beat_rank_1', 1, 200, 100, 'legendary'),
  ('Leyenda', '100 victorias totales', 'Star', 'combat', 'total_wins', 100, 150, 75, 'legendary');

-- Social (3)
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, reward_oc, reward_xp, rarity) VALUES
  ('Popular', 'Recibe 10 retos de otros bladers', 'Users', 'social', 'challenges_received', 10, 30, 15, 'rare'),
  ('Mentor', 'Ayuda a 3 jugadores nuevos', 'Heart', 'social', 'help_new_players', 3, 40, 20, 'rare'),
  ('Profeta', 'Acierta 5 predicciones', 'Eye', 'social', 'correct_predictions', 5, 50, 25, 'epic');

-- Collector (3)
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, reward_oc, reward_xp, rarity) VALUES
  ('Coleccionista', 'Tene 5 beyblades en tu ficha', 'Box', 'collector', 'owned_beys', 5, 30, 15, 'common'),
  ('Gacha Master', 'Saca un bey tier S en Gacha', 'Sparkles', 'collector', 'gacha_s_tier', 1, 75, 40, 'epic'),
  ('Full Deck', 'Registra un deck 3v3 completo', 'Layout', 'collector', 'has_deck', 1, 20, 10, 'common');

-- Tournament (3)
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, reward_oc, reward_xp, rarity) VALUES
  ('Campeon', 'Gana un torneo', 'Trophy', 'tournament', 'tournament_wins', 1, 200, 100, 'legendary'),
  ('Veterano', 'Participa en 10 torneos', 'Calendar', 'tournament', 'tournaments_played', 10, 75, 40, 'epic'),
  ('Podio', 'Termina en el top 3 cinco veces', 'Medal', 'tournament', 'top_3_count', 5, 100, 50, 'epic');

-- Special (6)
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, reward_oc, reward_xp, rarity) VALUES
  ('OG Blader', 'Te registraste en el primer mes', 'Clock', 'special', 'registered_first_month', 1, 50, 25, 'rare'),
  ('Omega', 'Alcanza la liga Omega (nivel max)', 'Zap', 'special', 'reach_omega_level', 1, 300, 150, 'legendary'),
  ('Racha de Fuego', '7 dias seguidos entrando a la app', 'Flame', 'special', 'login_streak_7', 7, 50, 25, 'rare'),
  ('Millonario', 'Acumula 1000 OC en total', 'Coins', 'special', 'total_oc_earned', 1000, 100, 50, 'epic'),
  ('El Muro', 'Gana 5 batallas con tipo Defense', 'ShieldCheck', 'special', 'wins_with_defense', 5, 40, 20, 'rare'),
  ('Velocista', 'Gana 5 batallas con tipo Attack', 'Zap', 'special', 'wins_with_attack', 5, 40, 20, 'rare');
