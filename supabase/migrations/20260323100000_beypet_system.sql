-- ============================================================
-- BeyPet (Tamagotchi) System
-- Cada blader puede tener UN beypet activo basado en su beyblade
-- ============================================================

-- Omega Coins column en players (moneda virtual para BeyPet battles)
ALTER TABLE players ADD COLUMN IF NOT EXISTS omega_coins integer NOT NULL DEFAULT 100;

-- Tabla principal de beypets
CREATE TABLE IF NOT EXISTS beypets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name text NOT NULL,
  beast_type text NOT NULL, -- nombre del beyblade beast
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 3),
  -- 1 = Rookie, 2 = Champion, 3 = Ultimate
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  energy integer NOT NULL DEFAULT 100 CHECK (energy >= 0 AND energy <= 100),
  atk integer NOT NULL DEFAULT 10,
  def integer NOT NULL DEFAULT 10,
  sta integer NOT NULL DEFAULT 10,
  last_fed timestamptz,
  last_battle timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Un solo beypet activo por jugador
  CONSTRAINT unique_player_beypet UNIQUE (player_id)
);

-- Historial de batallas beypet
CREATE TABLE IF NOT EXISTS beypet_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_id uuid NOT NULL REFERENCES players(id),
  defender_id uuid NOT NULL REFERENCES players(id),
  winner_id uuid NOT NULL REFERENCES players(id),
  omega_coins_bet integer NOT NULL DEFAULT 0,
  attacker_roll integer NOT NULL,
  defender_roll integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_beypets_player_id ON beypets(player_id);
CREATE INDEX IF NOT EXISTS idx_beypet_battles_attacker ON beypet_battles(attacker_id);
CREATE INDEX IF NOT EXISTS idx_beypet_battles_defender ON beypet_battles(defender_id);
CREATE INDEX IF NOT EXISTS idx_beypet_battles_created ON beypet_battles(created_at DESC);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE beypets ENABLE ROW LEVEL SECURITY;
ALTER TABLE beypet_battles ENABLE ROW LEVEL SECURITY;

-- Beypets: todos pueden leer, solo el dueno puede modificar
CREATE POLICY "beypets_select_all" ON beypets
  FOR SELECT USING (true);

CREATE POLICY "beypets_insert_own" ON beypets
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "beypets_update_own" ON beypets
  FOR UPDATE USING (auth.uid() = player_id)
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "beypets_delete_own" ON beypets
  FOR DELETE USING (auth.uid() = player_id);

-- Beypet battles: todos pueden leer
CREATE POLICY "beypet_battles_select_all" ON beypet_battles
  FOR SELECT USING (true);

CREATE POLICY "beypet_battles_insert_participant" ON beypet_battles
  FOR INSERT WITH CHECK (auth.uid() = attacker_id);
