-- Fix activity_feed INSERT policy: restrict actor_id to authenticated user's own ID.
-- Previously any authenticated user could insert events with any actor_id,
-- which is a privilege escalation risk (spoofing activity as another user).

DROP POLICY IF EXISTS "feed_insert_auth" ON activity_feed;
DROP POLICY IF EXISTS "feed_insert_own" ON activity_feed;

CREATE POLICY "feed_insert_own" ON activity_feed FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());
