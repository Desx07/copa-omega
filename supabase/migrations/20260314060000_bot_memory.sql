-- Bot conversation memory per player
CREATE TABLE bot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]',
  bot_name text NOT NULL DEFAULT 'BeyBot',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id)
);

ALTER TABLE bot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bot_select_own" ON bot_conversations FOR SELECT TO authenticated
  USING (player_id = auth.uid());
CREATE POLICY "bot_insert_own" ON bot_conversations FOR INSERT TO authenticated
  WITH CHECK (player_id = auth.uid());
CREATE POLICY "bot_update_own" ON bot_conversations FOR UPDATE TO authenticated
  USING (player_id = auth.uid());

CREATE INDEX idx_bot_conversations_player ON bot_conversations(player_id);
