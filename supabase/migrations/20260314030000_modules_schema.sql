-- ============================================================================
-- COPA OMEGA STAR — Full modules schema
-- Modules: Tournaments, Brackets, Store, Badges, Judges, History, Push
-- ============================================================================

-- ────────────────────────────────────────────
-- 1. TOURNAMENTS
-- ────────────────────────────────────────────

CREATE TABLE tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  format text NOT NULL CHECK (format IN ('round_robin', 'swiss', 'single_elimination')),
  max_participants int NOT NULL CHECK (max_participants >= 2),
  status text NOT NULL DEFAULT 'registration' CHECK (status IN ('registration', 'in_progress', 'completed', 'cancelled')),
  qr_code text, -- stored QR data/URL
  current_round int NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES players(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  seed int, -- seeding position
  points int NOT NULL DEFAULT 0,
  tournament_wins int NOT NULL DEFAULT 0,
  tournament_losses int NOT NULL DEFAULT 0,
  is_eliminated boolean NOT NULL DEFAULT false,
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

CREATE TABLE tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round int NOT NULL,
  match_order int NOT NULL DEFAULT 0, -- position in bracket
  player1_id uuid REFERENCES players(id),
  player2_id uuid REFERENCES players(id),
  winner_id uuid REFERENCES players(id),
  player1_score int DEFAULT 0,
  player2_score int DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'bye')),
  judge_id uuid REFERENCES players(id), -- assigned judge
  bracket_position text, -- e.g. 'QF1', 'SF1', 'F'
  next_match_id uuid REFERENCES tournament_matches(id), -- winner goes here
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Indexes
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_player ON tournament_participants(player_id);
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_round ON tournament_matches(tournament_id, round);

-- ────────────────────────────────────────────
-- 2. STORE / PRODUCTS / ORDERS
-- ────────────────────────────────────────────

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  total decimal(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'transfer')),
  payment_proof_url text, -- transfer receipt image
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_player ON orders(player_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ────────────────────────────────────────────
-- 3. BADGES / ACHIEVEMENTS
-- ────────────────────────────────────────────

CREATE TABLE badges (
  id text PRIMARY KEY, -- 'first_win', 'streak_3', etc.
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL, -- emoji
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE player_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  badge_id text NOT NULL REFERENCES badges(id),
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  seen boolean NOT NULL DEFAULT false, -- for in-app notification
  UNIQUE(player_id, badge_id)
);

CREATE INDEX idx_player_badges_player ON player_badges(player_id);

-- Seed badge definitions
INSERT INTO badges (id, name, description, icon) VALUES
  ('first_win', 'Primera Victoria', 'Ganá tu primera batalla', '🌟'),
  ('streak_3', 'En Llamas', 'Racha de 3 victorias seguidas', '🔥'),
  ('streak_5', 'Imparable', 'Racha de 5 victorias seguidas', '⚡'),
  ('champion', 'Campeón', 'Ganá un torneo', '🏆'),
  ('executioner', 'Verdugo', 'Eliminá a 3 bladers en el mismo torneo', '💀'),
  ('sniper', 'Francotirador', 'Win rate mayor a 80% con mínimo 10 batallas', '🎯'),
  ('legend', 'Leyenda', 'Ganá 3 torneos en total', '👑'),
  ('veteran', 'Veterano', 'Participá en 5 torneos', '🤝');

-- ────────────────────────────────────────────
-- 4. JUDGES — extend players table
-- ────────────────────────────────────────────

ALTER TABLE players ADD COLUMN IF NOT EXISTS is_judge boolean NOT NULL DEFAULT false;

-- ────────────────────────────────────────────
-- 5. TOURNAMENT POINTS (accumulated ranking)
-- ────────────────────────────────────────────

CREATE TABLE tournament_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  position int, -- final position in tournament (1st, 2nd, 3rd, etc.)
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, tournament_id)
);

CREATE INDEX idx_tournament_points_player ON tournament_points(player_id);

-- ────────────────────────────────────────────
-- 6. PUSH SUBSCRIPTIONS
-- ────────────────────────────────────────────

CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_player ON push_subscriptions(player_id);

-- ────────────────────────────────────────────
-- 7. CHAT BOT SESSIONS (optional persistence)
-- ────────────────────────────────────────────

-- Bot chat is session-based (client-side state), no table needed.
-- If we want to persist conversations later, add this:
-- CREATE TABLE bot_conversations (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
--   messages jsonb NOT NULL DEFAULT '[]',
--   created_at timestamptz NOT NULL DEFAULT now(),
--   updated_at timestamptz NOT NULL DEFAULT now()
-- );

-- ────────────────────────────────────────────
-- 8. RLS POLICIES
-- ────────────────────────────────────────────

-- Tournaments: public read, admin/judge write
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournaments_select_all" ON tournaments FOR SELECT USING (true);
CREATE POLICY "tournaments_insert_admin" ON tournaments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "tournaments_update_admin" ON tournaments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

-- Tournament participants: public read, authenticated insert own, admin manage
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tp_select_all" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "tp_insert_own" ON tournament_participants FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid() OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "tp_delete_admin" ON tournament_participants FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

-- Tournament matches: public read, admin/judge update
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tm_select_all" ON tournament_matches FOR SELECT USING (true);
CREATE POLICY "tm_insert_admin" ON tournament_matches FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "tm_update_admin_judge" ON tournament_matches FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
    OR (judge_id = auth.uid() AND EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_judge = true))
  );

-- Products: public read, admin write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_all" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert_admin" ON products FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "products_update_admin" ON products FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "products_delete_admin" ON products FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

-- Product images: public read, admin write
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi_select_all" ON product_images FOR SELECT USING (true);
CREATE POLICY "pi_insert_admin" ON product_images FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "pi_delete_admin" ON product_images FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

-- Orders: own read, admin read all, own insert
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON orders FOR SELECT TO authenticated
  USING (player_id = auth.uid() OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "orders_insert_own" ON orders FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());
CREATE POLICY "orders_update_admin" ON orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

-- Order items: same as orders
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oi_select_own" ON order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND (orders.player_id = auth.uid() OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true))));
CREATE POLICY "oi_insert_own" ON order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.player_id = auth.uid()));

-- Badges: public read
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select_all" ON badges FOR SELECT USING (true);

-- Player badges: public read, system insert (via functions)
ALTER TABLE player_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pb_select_all" ON player_badges FOR SELECT USING (true);
CREATE POLICY "pb_update_own" ON player_badges FOR UPDATE TO authenticated
  USING (player_id = auth.uid());

-- Tournament points: public read
ALTER TABLE tournament_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tpoints_select_all" ON tournament_points FOR SELECT USING (true);
CREATE POLICY "tpoints_insert_admin" ON tournament_points FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true));

-- Push subscriptions: own only
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_select_own" ON push_subscriptions FOR SELECT TO authenticated
  USING (player_id = auth.uid());
CREATE POLICY "push_insert_own" ON push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());
CREATE POLICY "push_delete_own" ON push_subscriptions FOR DELETE TO authenticated
  USING (player_id = auth.uid());

-- ────────────────────────────────────────────
-- 9. STORAGE BUCKET for product images & payment proofs
-- ────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payments', 'payments', false)
  ON CONFLICT (id) DO NOTHING;

-- Product images: public read, admin upload
CREATE POLICY "products_storage_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'products');
CREATE POLICY "products_storage_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products' AND EXISTS (SELECT 1 FROM public.players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "products_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'products' AND EXISTS (SELECT 1 FROM public.players WHERE id = auth.uid() AND is_admin = true));

-- Payment proofs: own upload, admin read
CREATE POLICY "payments_storage_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "payments_storage_read_admin" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payments' AND EXISTS (SELECT 1 FROM public.players WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "payments_storage_read_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payments' AND (storage.foldername(name))[1] = auth.uid()::text);
