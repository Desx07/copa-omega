-- Profile features: tagline, hide_beys, badge emoji, accent color
ALTER TABLE players ADD COLUMN IF NOT EXISTS tagline text CHECK (char_length(tagline) <= 60);
ALTER TABLE players ADD COLUMN IF NOT EXISTS hide_beys boolean NOT NULL DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS badge text CHECK (badge IN ('fire','lightning','skull','crown','sword','star','dragon','wolf','ice','boom'));
ALTER TABLE players ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT 'purple' CHECK (accent_color IN ('red','blue','green','purple','gold','white'));
