-- =============================================
-- Coliseo (Battle Royale) + Live Predictions
-- con Omega Coins
-- =============================================

-- 1. Agregar omega_coins a players (si no existe)
ALTER TABLE players ADD COLUMN IF NOT EXISTS omega_coins integer NOT NULL DEFAULT 100;

-- 2. Tabla coliseo_events
CREATE TABLE IF NOT EXISTS coliseo_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'live', 'completed')),
  max_players integer NOT NULL DEFAULT 8,
  entry_fee_oc integer NOT NULL DEFAULT 0,
  prize_pool_oc integer NOT NULL DEFAULT 0,
  winner_id uuid REFERENCES players(id) ON DELETE SET NULL,
  created_by uuid REFERENCES players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Tabla coliseo_participants
CREATE TABLE IF NOT EXISTS coliseo_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES coliseo_events(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  placement integer,
  eliminated_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, player_id)
);

-- 4. Tabla live_predictions (apuestas con OC en matches en vivo)
CREATE TABLE IF NOT EXISTS live_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  predictor_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  predicted_winner_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  omega_coins_bet integer NOT NULL CHECK (omega_coins_bet > 0),
  result text NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending', 'won', 'lost')),
  payout_oc integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, predictor_id)
);

-- =============================================
-- RLS Policies
-- =============================================

-- coliseo_events: todos leen, admin/judge crean y actualizan
ALTER TABLE coliseo_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coliseo_events_select" ON coliseo_events
  FOR SELECT USING (true);

CREATE POLICY "coliseo_events_insert" ON coliseo_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid()
      AND (is_admin = true OR is_judge = true)
    )
  );

CREATE POLICY "coliseo_events_update" ON coliseo_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid()
      AND (is_admin = true OR is_judge = true)
    )
  );

-- coliseo_participants: todos leen, jugadores insertan su propia fila
ALTER TABLE coliseo_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coliseo_participants_select" ON coliseo_participants
  FOR SELECT USING (true);

CREATE POLICY "coliseo_participants_insert" ON coliseo_participants
  FOR INSERT WITH CHECK (player_id = auth.uid());

CREATE POLICY "coliseo_participants_update" ON coliseo_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid()
      AND (is_admin = true OR is_judge = true)
    )
  );

-- live_predictions: todos leen, jugadores insertan su propia prediccion
ALTER TABLE live_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_predictions_select" ON live_predictions
  FOR SELECT USING (true);

CREATE POLICY "live_predictions_insert" ON live_predictions
  FOR INSERT WITH CHECK (predictor_id = auth.uid());

CREATE POLICY "live_predictions_update" ON live_predictions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE id = auth.uid()
      AND (is_admin = true OR is_judge = true)
    )
  );

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_coliseo_events_status ON coliseo_events(status);
CREATE INDEX IF NOT EXISTS idx_coliseo_participants_event ON coliseo_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_coliseo_participants_player ON coliseo_participants(player_id);
CREATE INDEX IF NOT EXISTS idx_live_predictions_match ON live_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_live_predictions_predictor ON live_predictions(predictor_id);

-- =============================================
-- RPC: resolve_live_predictions
-- Cuando un match se completa, resuelve las apuestas
-- =============================================

CREATE OR REPLACE FUNCTION resolve_live_predictions(p_match_id uuid, p_winner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_pool integer;
  winner_pool integer;
  rec record;
BEGIN
  -- Calcular pool total y pool ganador
  SELECT COALESCE(SUM(omega_coins_bet), 0) INTO total_pool
  FROM live_predictions WHERE match_id = p_match_id AND result = 'pending';

  SELECT COALESCE(SUM(omega_coins_bet), 0) INTO winner_pool
  FROM live_predictions WHERE match_id = p_match_id AND result = 'pending' AND predicted_winner_id = p_winner_id;

  -- Marcar perdedores
  UPDATE live_predictions
  SET result = 'lost', payout_oc = 0
  WHERE match_id = p_match_id AND result = 'pending' AND predicted_winner_id != p_winner_id;

  -- Repartir proporcionalmente a ganadores
  IF winner_pool > 0 THEN
    FOR rec IN
      SELECT id, predictor_id, omega_coins_bet
      FROM live_predictions
      WHERE match_id = p_match_id AND result = 'pending' AND predicted_winner_id = p_winner_id
    LOOP
      DECLARE
        payout integer;
      BEGIN
        -- Payout proporcional: (bet / winner_pool) * total_pool
        payout := FLOOR((rec.omega_coins_bet::numeric / winner_pool::numeric) * total_pool::numeric);

        UPDATE live_predictions
        SET result = 'won', payout_oc = payout
        WHERE id = rec.id;

        -- Devolver payout al jugador
        UPDATE players
        SET omega_coins = omega_coins + payout
        WHERE id = rec.predictor_id;
      END;
    END LOOP;
  ELSE
    -- Nadie acerto: devolver OC a todos
    FOR rec IN
      SELECT id, predictor_id, omega_coins_bet
      FROM live_predictions
      WHERE match_id = p_match_id AND result = 'pending'
    LOOP
      UPDATE live_predictions SET result = 'lost', payout_oc = rec.omega_coins_bet WHERE id = rec.id;
      UPDATE players SET omega_coins = omega_coins + rec.omega_coins_bet WHERE id = rec.predictor_id;
    END LOOP;
  END IF;
END;
$$;
