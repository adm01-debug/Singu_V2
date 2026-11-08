ALTER TABLE zapp_history.message_links
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES zapp_history.conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ml_conversation
  ON zapp_history.message_links(conversation_id);
