CREATE OR REPLACE FUNCTION public.ensure_ai_gateway_metrics_partition(target_month date DEFAULT NULL::date)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  m_start   date := date_trunc('month', COALESCE(target_month, (now() + interval '1 month')::date))::date;
  m_end     date;
  part_name text;
BEGIN
  m_end := (m_start + interval '1 month')::date;
  part_name := format('ai_gateway_metrics_%s', to_char(m_start, 'YYYY_MM'));

  IF to_regclass(format('public.%I', part_name)) IS NULL THEN
    EXECUTE format(
      'CREATE TABLE public.%I PARTITION OF public.ai_gateway_metrics FOR VALUES FROM (%L) TO (%L)',
      part_name, m_start, m_end
    );
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', part_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', part_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', part_name);
  END IF;

  RETURN part_name;
END;
$function$
