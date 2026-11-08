CREATE OR REPLACE FUNCTION public.get_slow_queries_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'stats', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          calls,
          ROUND(total_exec_time::numeric, 2) as total_time_ms,
          ROUND(mean_exec_time::numeric, 2) as avg_time_ms,
          ROUND((100 * total_exec_time / sum(total_exec_time) OVER())::numeric, 2) as percent_total,
          LEFT(query, 100) as query_preview
        FROM pg_stat_statements
        ORDER BY total_exec_time DESC
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN undefined_table THEN
    RETURN jsonb_build_object('error', 'pg_stat_statements not enabled');
END;
$function$
