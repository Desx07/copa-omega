-- Allow stars_bet = 0 for friendly/casual matches (amistoso mode)
-- When stars_bet = 0, no stars are transferred on resolve/reverse/edit.
-- The existing RPCs (resolve_match, reverse_match_stars, edit_match_winner)
-- already handle stars_bet = 0 correctly via arithmetic (adds/subtracts 0).

-- 1. Update CHECK constraint to allow 0
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_stars_bet_check;

-- The original constraint name from initial_schema might be auto-generated
-- Try common naming patterns
DO $$
BEGIN
  -- Try dropping by the column-level check name pattern
  EXECUTE 'ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_stars_bet_check';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Drop any remaining check on stars_bet by finding it dynamically
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'matches'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%stars_bet%'
  LOOP
    EXECUTE format('ALTER TABLE public.matches DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Re-add constraint allowing 0-5
ALTER TABLE public.matches ADD CONSTRAINT matches_stars_bet_check
  CHECK (stars_bet BETWEEN 0 AND 5);
