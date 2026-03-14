-- Copa Omega Star — Profile, Beys & Admin features
-- Migration: 20260314000000_profile_beys_admin.sql

--------------------------------------------------------------------------------
-- 1. Add is_hidden column to players (hide from public ranking)
--------------------------------------------------------------------------------

ALTER TABLE players ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

--------------------------------------------------------------------------------
-- 2. Beys table
--------------------------------------------------------------------------------

CREATE TABLE beys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('attack', 'defense', 'stamina', 'balance')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_beys_player_id ON beys(player_id);

ALTER TABLE beys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beys_select" ON beys FOR SELECT TO authenticated USING (true);

CREATE POLICY "beys_insert" ON beys FOR INSERT TO authenticated
  WITH CHECK (
    player_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "beys_delete" ON beys FOR DELETE TO authenticated
  USING (
    player_id = auth.uid()
    OR EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

--------------------------------------------------------------------------------
-- 3. Admin can update ANY player (for hide/unhide, etc.)
--------------------------------------------------------------------------------

CREATE POLICY "players_update_admin" ON players FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

--------------------------------------------------------------------------------
-- 4. Admin can delete players
--------------------------------------------------------------------------------

CREATE POLICY "players_delete_admin" ON players FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

--------------------------------------------------------------------------------
-- 5. Storage bucket for avatars
--------------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder
CREATE POLICY "avatars_upload_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can update their own avatar
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can delete their own avatar
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
