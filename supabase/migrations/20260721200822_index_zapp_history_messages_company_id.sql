-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721200822
-- nome:   index_zapp_history_messages_company_id

-- Migration: index_zapp_history_messages_company_id (Wave 146)
-- Adds missing FK index on zapp_history.messages(company_id).
-- Fixes unindexed_foreign_keys advisor for zapp_history schema.

CREATE INDEX IF NOT EXISTS idx_messages_company_id
  ON zapp_history.messages (company_id);
