-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721002547
-- nome:   add_missing_indexes_pipeline_notifications

-- Index for Kanban pipeline view (groups/filters deals by stage constantly)
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_stage
  ON public.deals (pipeline_stage);

-- Partial indexes for dismissed=false filter (hot path in notification loading)
CREATE INDEX IF NOT EXISTS idx_insights_not_dismissed
  ON public.insights (user_id, created_at DESC)
  WHERE dismissed = false;

CREATE INDEX IF NOT EXISTS idx_health_alerts_not_dismissed
  ON public.health_alerts (user_id, created_at DESC)
  WHERE dismissed = false;

-- Company-based filtering for stakeholder alerts
CREATE INDEX IF NOT EXISTS idx_stakeholder_alerts_company_id
  ON public.stakeholder_alerts (company_id);

-- Composite index for the common notification query pattern:
-- SELECT * FROM alerts WHERE user_id = X AND dismissed = false ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_alerts_user_not_dismissed
  ON public.alerts (user_id, created_at DESC)
  WHERE dismissed = false;
