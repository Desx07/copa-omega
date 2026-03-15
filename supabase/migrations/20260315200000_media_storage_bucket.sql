-- ============================================================================
-- COPA OMEGA STAR — Media Storage Bucket
-- Creates the 'media' bucket for tournament gallery photo uploads.
-- Also ensures the 'avatars' bucket has proper RLS for profile card uploads.
-- ============================================================================

-- 1. Create 'media' bucket (public, for tournament gallery photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Ensure 'avatars' bucket exists (for profile cards and podium cards too)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────
-- 3. Storage RLS policies for 'media' bucket
-- ────────────────────────────────────────────

-- Anyone can view media
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Admins can upload media
CREATE POLICY "media_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update/overwrite media
CREATE POLICY "media_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can delete media
CREATE POLICY "media_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
  );

-- ────────────────────────────────────────────
-- 4. Storage RLS policies for 'avatars' bucket
--    (may already exist, using IF NOT EXISTS pattern via DO block)
-- ────────────────────────────────────────────

-- Anyone can view avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_public_read'
  ) THEN
    CREATE POLICY "avatars_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Authenticated users can upload to their own folder in avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_owner_insert'
  ) THEN
    CREATE POLICY "avatars_owner_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'avatars'
        AND (
          -- Own avatar/profile-card folder
          (storage.foldername(name))[1] = auth.uid()::text
          -- OR admin uploading podium cards
          OR (
            (storage.foldername(name))[1] = 'podium-cards'
            AND EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
          )
        )
      );
  END IF;
END $$;

-- Authenticated users can update their own files in avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_owner_update'
  ) THEN
    CREATE POLICY "avatars_owner_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (
          (storage.foldername(name))[1] = auth.uid()::text
          OR (
            (storage.foldername(name))[1] = 'podium-cards'
            AND EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
          )
        )
      );
  END IF;
END $$;

-- Authenticated users can delete their own files in avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_owner_delete'
  ) THEN
    CREATE POLICY "avatars_owner_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (
          (storage.foldername(name))[1] = auth.uid()::text
          OR (
            (storage.foldername(name))[1] = 'podium-cards'
            AND EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND is_admin = true)
          )
        )
      );
  END IF;
END $$;
