-- Referral system
ALTER TABLE players ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES players(id);

-- Generate referral codes for existing players (use first 4 chars of alias + random 4 chars)
UPDATE players SET referral_code = LOWER(LEFT(alias, 4)) || SUBSTR(MD5(RANDOM()::text), 1, 4)
WHERE referral_code IS NULL;

-- Referral tracking table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  stars_awarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(referrer_id, referred_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own referrals"
  ON referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_id);

-- Function to generate referral code for new players
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := LOWER(LEFT(COALESCE(NEW.alias, 'user'), 4)) || SUBSTR(MD5(RANDOM()::text), 1, 4);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();
