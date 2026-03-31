-- =============================================
-- Copa Ascenso — League / Division System
-- 5 ligas escalonadas por estrellas
-- =============================================

-- 1. Tabla de ligas
CREATE TABLE IF NOT EXISTS leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  tier integer NOT NULL UNIQUE CHECK (tier BETWEEN 1 AND 5),
  min_stars integer NOT NULL DEFAULT 0,
  max_stars integer, -- NULL = sin techo (Liga Omega)
  max_players integer NOT NULL DEFAULT 50,
  color text NOT NULL DEFAULT '#FFFFFF',
  icon text NOT NULL DEFAULT 'shield',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Membresias de liga (relacion jugador-liga por temporada)
CREATE TABLE IF NOT EXISTS league_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season_id uuid REFERENCES seasons(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  games_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  promotion_points integer NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, season_id)
);

-- 3. Historial de ascensos/descensos
CREATE TABLE IF NOT EXISTS league_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  from_league uuid REFERENCES leagues(id) ON DELETE SET NULL,
  to_league uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  season_id uuid REFERENCES seasons(id) ON DELETE SET NULL,
  reason text NOT NULL DEFAULT 'placement'
    CHECK (reason IN ('promotion', 'relegation', 'placement')),
  changed_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- Seed: 5 ligas con umbrales de estrellas
-- =============================================

INSERT INTO leagues (name, tier, min_stars, max_stars, max_players, color, icon)
VALUES
  ('Bronce',    1, 0,    20, 50, '#CD7F32', 'shield'),
  ('Plata',     2, 21,   30, 40, '#C0C0C0', 'shield-half'),
  ('Oro',       3, 31,   40, 30, '#FFD700', 'crown'),
  ('Diamante',  4, 41,   55, 20, '#00CED1', 'gem'),
  ('Omega',     5, 56, NULL, 10, '#8B5CF6', 'zap')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- RLS Policies
-- =============================================

-- leagues: todos leen, solo admin modifica
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leagues_select" ON leagues
  FOR SELECT USING (true);

CREATE POLICY "leagues_admin_insert" ON leagues
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "leagues_admin_update" ON leagues
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "leagues_admin_delete" ON leagues
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- league_memberships: todos leen, admin gestiona
ALTER TABLE league_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "league_memberships_select" ON league_memberships
  FOR SELECT USING (true);

CREATE POLICY "league_memberships_admin_insert" ON league_memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "league_memberships_admin_update" ON league_memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "league_memberships_admin_delete" ON league_memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- league_history: todos leen, admin gestiona
ALTER TABLE league_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "league_history_select" ON league_history
  FOR SELECT USING (true);

CREATE POLICY "league_history_admin_insert" ON league_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_league_memberships_player ON league_memberships(player_id);
CREATE INDEX IF NOT EXISTS idx_league_memberships_league ON league_memberships(league_id);
CREATE INDEX IF NOT EXISTS idx_league_memberships_season ON league_memberships(season_id);
CREATE INDEX IF NOT EXISTS idx_league_history_player ON league_history(player_id);
CREATE INDEX IF NOT EXISTS idx_leagues_tier ON leagues(tier);

-- =============================================
-- RPC: recalculate_league_memberships
-- Recalcula la liga de TODOS los jugadores activos
-- basandose en sus estrellas actuales
-- =============================================

CREATE OR REPLACE FUNCTION recalculate_league_memberships(p_season_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_season_id uuid;
  v_player record;
  v_target_league record;
  v_current_membership record;
  v_moved integer := 0;
  v_placed integer := 0;
  v_total integer := 0;
BEGIN
  -- Determinar season activa si no se pasa
  IF p_season_id IS NULL THEN
    SELECT id INTO v_season_id FROM seasons WHERE status = 'active' LIMIT 1;
  ELSE
    v_season_id := p_season_id;
  END IF;

  -- Iterar jugadores activos (no eliminados, no ocultos)
  FOR v_player IN
    SELECT id, stars FROM players
    WHERE is_eliminated = false
    ORDER BY stars DESC
  LOOP
    v_total := v_total + 1;

    -- Encontrar liga correspondiente por estrellas
    SELECT * INTO v_target_league FROM leagues
    WHERE v_player.stars >= min_stars
      AND (max_stars IS NULL OR v_player.stars <= max_stars)
    ORDER BY tier DESC
    LIMIT 1;

    -- Si no encuentra liga (edge case), asignar Bronce
    IF v_target_league IS NULL THEN
      SELECT * INTO v_target_league FROM leagues WHERE tier = 1;
    END IF;

    -- Buscar membership actual
    SELECT * INTO v_current_membership FROM league_memberships
    WHERE player_id = v_player.id AND season_id = v_season_id;

    IF v_current_membership IS NULL THEN
      -- Nuevo en el sistema: insertar
      INSERT INTO league_memberships (player_id, league_id, season_id)
      VALUES (v_player.id, v_target_league.id, v_season_id);

      -- Registrar historial como placement
      INSERT INTO league_history (player_id, to_league, season_id, reason)
      VALUES (v_player.id, v_target_league.id, v_season_id, 'placement');

      v_placed := v_placed + 1;

    ELSIF v_current_membership.league_id != v_target_league.id THEN
      -- Cambio de liga
      DECLARE
        v_old_tier integer;
        v_new_tier integer;
        v_reason text;
      BEGIN
        SELECT tier INTO v_old_tier FROM leagues WHERE id = v_current_membership.league_id;
        v_new_tier := v_target_league.tier;

        IF v_new_tier > v_old_tier THEN
          v_reason := 'promotion';
        ELSE
          v_reason := 'relegation';
        END IF;

        -- Actualizar membership
        UPDATE league_memberships
        SET league_id = v_target_league.id
        WHERE id = v_current_membership.id;

        -- Registrar en historial
        INSERT INTO league_history (player_id, from_league, to_league, season_id, reason)
        VALUES (v_player.id, v_current_membership.league_id, v_target_league.id, v_season_id, v_reason);

        v_moved := v_moved + 1;
      END;
    END IF;
  END LOOP;

  -- Actualizar posiciones dentro de cada liga
  UPDATE league_memberships lm
  SET position = sub.pos
  FROM (
    SELECT lm2.id,
           ROW_NUMBER() OVER (
             PARTITION BY lm2.league_id
             ORDER BY p.stars DESC, p.wins DESC
           ) AS pos
    FROM league_memberships lm2
    JOIN players p ON p.id = lm2.player_id
    WHERE lm2.season_id = v_season_id
  ) sub
  WHERE lm.id = sub.id;

  RETURN jsonb_build_object(
    'total_players', v_total,
    'placed', v_placed,
    'moved', v_moved,
    'season_id', v_season_id
  );
END;
$$;
