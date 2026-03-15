-- ============================================================================
-- COPA OMEGA STAR — Media, Chat, Tournament Badges
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. TOURNAMENT LOGOS
-- ────────────────────────────────────────────

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS logo_url text;

-- ────────────────────────────────────────────
-- 2. TOURNAMENT WINNER BADGES (top 3)
-- ────────────────────────────────────────────

CREATE TABLE tournament_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  position int NOT NULL CHECK (position BETWEEN 1 AND 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, tournament_id)
);

CREATE INDEX idx_tournament_badges_player ON tournament_badges(player_id);

ALTER TABLE tournament_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tb_select_all" ON tournament_badges FOR SELECT USING (true);
CREATE POLICY "tb_insert_admin" ON tournament_badges FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "tb_delete_admin" ON tournament_badges FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

-- ────────────────────────────────────────────
-- 3. TOURNAMENT MEDIA (photos + video links)
-- ────────────────────────────────────────────

CREATE TABLE tournament_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('photo', 'video')),
  url text NOT NULL,
  thumbnail_url text,
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES players(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tournament_media_tournament ON tournament_media(tournament_id);

ALTER TABLE tournament_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tm_media_select_all" ON tournament_media FOR SELECT USING (true);
CREATE POLICY "tm_media_insert_admin" ON tournament_media FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "tm_media_update_admin" ON tournament_media FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "tm_media_delete_admin" ON tournament_media FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

-- ────────────────────────────────────────────
-- 4. CAROUSEL ITEMS (landing page)
-- ────────────────────────────────────────────

CREATE TABLE carousel_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('photo', 'video')),
  url text NOT NULL,
  thumbnail_url text,
  title text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES players(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE carousel_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carousel_select_all" ON carousel_items FOR SELECT USING (true);
CREATE POLICY "carousel_insert_admin" ON carousel_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "carousel_update_admin" ON carousel_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "carousel_delete_admin" ON carousel_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

INSERT INTO app_settings (key, value) VALUES ('carousel_enabled', 'true')
  ON CONFLICT (key) DO NOTHING;

-- ────────────────────────────────────────────
-- 5. CHAT MESSAGES
-- ────────────────────────────────────────────

CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_select_authenticated" ON chat_messages FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "chat_insert_own" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (player_id = auth.uid());
CREATE POLICY "chat_delete_admin" ON chat_messages FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
