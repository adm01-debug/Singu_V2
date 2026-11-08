CREATE OR REPLACE FUNCTION public.get_api_stats(p_days integer DEFAULT 7)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'interactions_created', (
      SELECT COUNT(*) FROM interactions WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
    ),
    'companies_created', (
      SELECT COUNT(*) FROM companies WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
    ),
    'by_source_system', (
      SELECT jsonb_object_agg(COALESCE(source_system, 'manual'), cnt)
      FROM (
        SELECT source_system, COUNT(*) as cnt
        FROM interactions WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY source_system
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
