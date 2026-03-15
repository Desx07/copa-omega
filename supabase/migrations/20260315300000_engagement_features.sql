-- ============================================================================
-- COPA OMEGA STAR — Engagement Features
-- Retos, Feed, Racha, Head-to-Head, Predicciones, Props, Combos, Encuestas
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. CHALLENGES / RETOS
-- ────────────────────────────────────────────

CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL REFERENCES players(id),
  challenged_id uuid NOT NULL REFERENCES players(id),
  stars_bet int NOT NULL CHECK (stars_bet BETWEEN 1 AND 5),
  message text CHECK (char_length(message) <= 120),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined','completed','expired')),
  match_id uuid REFERENCES matches(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK (challenger_id != challenged_id)
);

CREATE INDEX idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX idx_challenges_status ON challenges(status);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges_select_all" ON challenges FOR SELECT TO authenticated USING (true);
CREATE POLICY "challenges_insert_own" ON challenges FOR INSERT TO authenticated
  WITH CHECK (challenger_id = auth.uid());
CREATE POLICY "challenges_update_involved" ON challenges FOR UPDATE TO authenticated
  USING (challenged_id = auth.uid() OR challenger_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

-- ────────────────────────────────────────────
-- 2. ACTIVITY FEED
-- ────────────────────────────────────────────

CREATE TABLE activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN (
    'match_result','challenge_created','challenge_accepted','challenge_declined',
    'challenge_completed','badge_unlocked','tournament_registration','tournament_result',
    'new_player','rank_change','streak','combo_shared'
  )),
  actor_id uuid REFERENCES players(id),
  target_id uuid REFERENCES players(id),
  reference_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_feed_actor ON activity_feed(actor_id);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_select_all" ON activity_feed FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_insert_auth" ON activity_feed FOR INSERT TO authenticated
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;

-- ────────────────────────────────────────────
-- 3. FEED REACTIONS
-- ────────────────────────────────────────────

CREATE TABLE feed_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_item_id uuid NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  reaction text NOT NULL CHECK (reaction IN ('fire','star','skull','lightning','laugh')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(feed_item_id, player_id)
);

CREATE INDEX idx_reactions_feed ON feed_reactions(feed_item_id);

ALTER TABLE feed_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_select_all" ON feed_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions_insert_own" ON feed_reactions FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());
CREATE POLICY "reactions_delete_own" ON feed_reactions FOR DELETE TO authenticated
  USING (player_id = auth.uid());

-- ────────────────────────────────────────────
-- 4. BATTLE COMMENTS (on match results only)
-- ────────────────────────────────────────────

CREATE TABLE battle_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  tournament_match_id uuid REFERENCES tournament_matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (match_id IS NOT NULL)::int + (tournament_match_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX idx_battle_comments_match ON battle_comments(match_id);
CREATE INDEX idx_battle_comments_tmatch ON battle_comments(tournament_match_id);

ALTER TABLE battle_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bc_select_all" ON battle_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "bc_insert_own" ON battle_comments FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());
CREATE POLICY "bc_delete_admin" ON battle_comments FOR DELETE TO authenticated
  USING (player_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

-- ────────────────────────────────────────────
-- 5. DAILY LOGIN STREAK
-- ────────────────────────────────────────────

ALTER TABLE players ADD COLUMN IF NOT EXISTS current_login_streak int NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS max_login_streak int NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_login_date date;

CREATE TABLE daily_logins (
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  login_date date NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (player_id, login_date)
);

ALTER TABLE daily_logins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logins_insert_own" ON daily_logins FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());
CREATE POLICY "logins_select_own" ON daily_logins FOR SELECT TO authenticated
  USING (player_id = auth.uid());

-- New streak badges
INSERT INTO badges (id, name, description, icon) VALUES
  ('streak_login_3', 'Constante', '3 días seguidos entrando a la app', '📅'),
  ('streak_login_7', 'Dedicado', '7 días seguidos entrando a la app', '🗓️'),
  ('streak_login_30', 'Leyenda Diaria', '30 días seguidos sin faltar', '💎')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────
-- 6. PREDICTIONS
-- ────────────────────────────────────────────

CREATE TABLE predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) ON DELETE CASCADE,
  tournament_match_id uuid REFERENCES tournament_matches(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE,
  predictor_id uuid NOT NULL REFERENCES players(id),
  predicted_winner_id uuid NOT NULL REFERENCES players(id),
  is_correct boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_prediction_per_match UNIQUE (match_id, predictor_id),
  CONSTRAINT unique_prediction_per_tmatch UNIQUE (tournament_match_id, predictor_id),
  CONSTRAINT unique_prediction_per_challenge UNIQUE (challenge_id, predictor_id)
);

ALTER TABLE players ADD COLUMN IF NOT EXISTS predictions_correct int NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS predictions_total int NOT NULL DEFAULT 0;

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pred_select_all" ON predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "pred_insert_own" ON predictions FOR INSERT TO authenticated
  WITH CHECK (predictor_id = auth.uid());

-- ────────────────────────────────────────────
-- 7. PROPS / RESPECT
-- ────────────────────────────────────────────

ALTER TABLE players ADD COLUMN IF NOT EXISTS props_received int NOT NULL DEFAULT 0;

CREATE TABLE props (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id),
  giver_id uuid NOT NULL REFERENCES players(id),
  receiver_id uuid NOT NULL REFERENCES players(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, giver_id)
);

ALTER TABLE props ENABLE ROW LEVEL SECURITY;
CREATE POLICY "props_select_all" ON props FOR SELECT TO authenticated USING (true);
CREATE POLICY "props_insert_own" ON props FOR INSERT TO authenticated
  WITH CHECK (giver_id = auth.uid());

INSERT INTO badges (id, name, description, icon) VALUES
  ('respected', 'Respetado', 'Recibí 50 props de rivales', '🤜'),
  ('fair_play', 'Fair Play Legend', 'Recibí 100 props de rivales', '🕊️')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────
-- 8. SHARED COMBOS (combo interactions)
-- ────────────────────────────────────────────

CREATE TABLE shared_combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  blade text NOT NULL,
  ratchet text NOT NULL,
  bit text NOT NULL,
  type text NOT NULL CHECK (type IN ('attack','defense','stamina','balance')),
  description text CHECK (char_length(description) <= 200),
  context text CHECK (context IN ('next_tournament','general','counter')),
  upvotes int NOT NULL DEFAULT 0,
  downvotes int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE combo_votes (
  combo_id uuid NOT NULL REFERENCES shared_combos(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('up', 'down')),
  PRIMARY KEY (combo_id, player_id)
);

ALTER TABLE shared_combos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "combos_select_all" ON shared_combos FOR SELECT TO authenticated USING (true);
CREATE POLICY "combos_insert_own" ON shared_combos FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());
CREATE POLICY "combos_delete_own_admin" ON shared_combos FOR DELETE TO authenticated
  USING (player_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

ALTER TABLE combo_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cv_select_all" ON combo_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "cv_insert_own" ON combo_votes FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());
CREATE POLICY "cv_delete_own" ON combo_votes FOR DELETE TO authenticated
  USING (player_id = auth.uid());

-- ────────────────────────────────────────────
-- 9. POLLS (admin quick polls)
-- ────────────────────────────────────────────

CREATE TABLE polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES players(id),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE poll_votes (
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  option_index int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, player_id)
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "polls_select_all" ON polls FOR SELECT TO authenticated USING (true);
CREATE POLICY "polls_insert_admin" ON polls FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "polls_update_admin" ON polls FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pv_select_all" ON poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "pv_insert_own" ON poll_votes FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());

-- ────────────────────────────────────────────
-- 10. DYNAMIC TITLES
-- ────────────────────────────────────────────

ALTER TABLE players ADD COLUMN IF NOT EXISTS current_title text NOT NULL DEFAULT 'Novato';

-- ────────────────────────────────────────────
-- 11. NOTIFICATION PREFERENCES
-- ────────────────────────────────────────────

CREATE TABLE notification_preferences (
  player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  challenges boolean NOT NULL DEFAULT true,
  match_results boolean NOT NULL DEFAULT true,
  feed_reactions boolean NOT NULL DEFAULT true,
  battle_comments boolean NOT NULL DEFAULT true,
  combo_interactions boolean NOT NULL DEFAULT true,
  polls boolean NOT NULL DEFAULT true,
  streak_warning boolean NOT NULL DEFAULT true
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "np_select_own" ON notification_preferences FOR SELECT TO authenticated
  USING (player_id = auth.uid());
CREATE POLICY "np_insert_own" ON notification_preferences FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());
CREATE POLICY "np_update_own" ON notification_preferences FOR UPDATE TO authenticated
  USING (player_id = auth.uid());
