CREATE OR REPLACE FUNCTION public.get_table_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'tables', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          schemaname,
          relname as table_name,
          n_live_tup as row_count,
          n_dead_tup as dead_rows,
          pg_size_pretty(pg_relation_size(schemaname || '.' || relname)) as size,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC
        LIMIT 20
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
