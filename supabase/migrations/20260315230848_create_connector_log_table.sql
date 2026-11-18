-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260315230848
-- nome:   create_connector_log_table

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
