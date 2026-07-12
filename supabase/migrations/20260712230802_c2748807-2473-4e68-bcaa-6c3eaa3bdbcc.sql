-- Índices de performance para o painel de auditoria de reanálise comportamental
-- Paginação keyset ordena por updated_at DESC; filtros comuns: last_error IS/NOT NULL, trigger_source.

CREATE INDEX IF NOT EXISTS idx_bpr_queue_updated_at_desc
  ON public.behavioral_profile_regen_queue (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_bpr_queue_last_error_updated
  ON public.behavioral_profile_regen_queue (updated_at DESC)
  WHERE last_error IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bpr_queue_trigger_source
  ON public.behavioral_profile_regen_queue (trigger_source, updated_at DESC);

-- Alerta ativo é lido a cada 60s pelo banner; index parcial acelera muito.
CREATE INDEX IF NOT EXISTS idx_system_alerts_active_by_type
  ON public.system_alerts (alert_type, created_at DESC)
  WHERE acknowledged_at IS NULL;