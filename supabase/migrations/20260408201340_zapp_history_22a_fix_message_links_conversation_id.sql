-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408201340
-- nome:   zapp_history_22a_fix_message_links_conversation_id

ALTER TABLE zapp_history.message_links
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES zapp_history.conversations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ml_conversation
  ON zapp_history.message_links(conversation_id);
