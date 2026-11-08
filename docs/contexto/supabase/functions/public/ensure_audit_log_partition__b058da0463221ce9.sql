CREATE OR REPLACE FUNCTION public.ensure_audit_log_partition(target_date date DEFAULT CURRENT_DATE)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
