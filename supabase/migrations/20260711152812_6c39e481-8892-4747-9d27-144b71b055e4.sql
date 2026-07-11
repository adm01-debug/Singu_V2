-- ============================================================
-- Particionamento mensal de public.audit_log (RANGE created_at)
-- Tabela estava vazia; recriação segura sem dataloss.
-- ============================================================

DROP TABLE IF EXISTS public.audit_log CASCADE;

CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])),
  old_data JSONB,
  new_data JSONB,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Índices no parent (propagados para partições)
CREATE INDEX idx_audit_log_entity ON public.audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON public.audit_log (user_id, created_at DESC);

-- Grants
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

-- RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON public.audit_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Função para criar partição mensal sob demanda
-- ============================================================
CREATE OR REPLACE FUNCTION public.ensure_audit_log_partition(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  start_month DATE := date_trunc('month', target_date)::DATE;
  end_month DATE := (date_trunc('month', target_date) + INTERVAL '1 month')::DATE;
  partition_name TEXT := format('audit_log_%s', to_char(start_month, 'YYYY_MM'));
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.audit_log FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_month, end_month
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_audit_log_partition(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_audit_log_partition(DATE) TO service_role, authenticated;

-- ============================================================
-- Cria as próximas 6 partições mensais + DEFAULT
-- ============================================================
DO $$
DECLARE
  i INT;
BEGIN
  FOR i IN 0..5 LOOP
    PERFORM public.ensure_audit_log_partition((CURRENT_DATE + (i || ' month')::INTERVAL)::DATE);
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.audit_log_default PARTITION OF public.audit_log DEFAULT;