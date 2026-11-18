-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409230707
-- nome:   audit_fix_02_fk_indexes

CREATE INDEX IF NOT EXISTS idx_messages_quoted_msg ON zapp_history.messages(quoted_message_id) WHERE quoted_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_company ON zapp_history.messages(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_cost_contact ON zapp_history.ai_cost_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_conv_wpp_conn ON zapp_history.conversations(whatsapp_connection_id);
CREATE INDEX IF NOT EXISTS idx_media_conv ON zapp_history.message_media(conversation_id);
CREATE INDEX IF NOT EXISTS idx_audio_conv ON zapp_history.message_audio(conversation_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_company ON zapp_history.conversation_daily_summaries(company_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_conv ON zapp_history.conversation_daily_summaries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_interaction ON zapp_history.conversation_daily_summaries(interaction_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_contact ON zapp_history.ai_training_dataset(contact_id);
CREATE INDEX IF NOT EXISTS idx_ai_training_conv ON zapp_history.ai_training_dataset(conversation_id);
