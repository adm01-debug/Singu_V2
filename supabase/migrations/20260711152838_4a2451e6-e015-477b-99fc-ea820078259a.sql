-- Ativa RLS em todas as partições existentes de audit_log
DO $$
DECLARE
  part_name TEXT;
BEGIN
  FOR part_name IN
    SELECT c.relname
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    WHERE p.relname = 'audit_log' AND p.relnamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', part_name);
  END LOOP;
END $$;

-- Recria a função para garantir RLS em partições futuras
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
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', partition_name);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_audit_log_partition(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_audit_log_partition(DATE) TO service_role, authenticated;