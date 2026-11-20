-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260722005234
-- nome:   wave179_partial_indexes_followup_alerts_insights

-- Wave 179: Missing partial indexes for follow_up_required, alerts.dismissed, insights.dismissed

-- 1. interactions: partial index for upcoming follow-up queries using modern column names
CREATE INDEX IF NOT EXISTS idx_interactions_followup_required_modern
  ON public.interactions (user_id, follow_up_date)
  WHERE follow_up_required = true AND follow_up_date IS NOT NULL;

-- 2. alerts: partial index for active (non-dismissed) alerts per contact
CREATE INDEX IF NOT EXISTS idx_alerts_active
  ON public.alerts (contact_id, user_id)
  WHERE dismissed = false;

-- 3. insights: partial index for active (non-dismissed) insights per contact
CREATE INDEX IF NOT EXISTS idx_insights_active
  ON public.insights (contact_id, user_id)
  WHERE dismissed = false;
