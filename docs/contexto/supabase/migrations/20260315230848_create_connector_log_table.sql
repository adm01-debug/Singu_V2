CREATE TABLE IF NOT EXISTS connector_log (
  id BIGSERIAL PRIMARY KEY,
  direction TEXT NOT NULL,
  whatsapp_number TEXT,
  push_name TEXT,
  message_text TEXT,
  bitrix_response JSONB,
  evolution_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
