-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409234406
-- nome:   zapp_audit_m13_partial_indexes_dashboard

-- Índice parcial: mensagens urgentes não processadas (fila de vendas)
CREATE INDEX IF NOT EXISTS idx_msg_sql_qualified_recent
  ON zapp_history.messages (created_at DESC)
  WHERE lead_score >= 80 AND quarantined = FALSE;

-- Índice parcial: mensagens churn (SAC priority)
CREATE INDEX IF NOT EXISTS idx_msg_churn_risk
  ON zapp_history.messages (created_at DESC)
  WHERE primary_intent IN ('reclamar','cancelar');

-- Índice parcial: zumbis (pros garbage collector cron)
CREATE INDEX IF NOT EXISTS idx_msg_unprocessed
  ON zapp_history.messages (created_at)
  WHERE nlp_processed_at IS NULL;

-- Índice parcial: spam quarentenado (pros dashboards de segurança)
CREATE INDEX IF NOT EXISTS idx_msg_quarantined
  ON zapp_history.messages (created_at DESC)
  WHERE quarantined = TRUE;

-- Índice funcional: busca por bant classification no jsonb
CREATE INDEX IF NOT EXISTS idx_msg_bant_classification
  ON zapp_history.messages ((bant_score->>'classification'));

-- Índice funcional: busca por primary_intent
CREATE INDEX IF NOT EXISTS idx_msg_primary_intent
  ON zapp_history.messages (primary_intent)
  WHERE nlp_processed_at IS NOT NULL;
