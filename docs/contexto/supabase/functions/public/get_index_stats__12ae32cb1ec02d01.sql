CREATE OR REPLACE FUNCTION public.get_index_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'total_indexes', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
    'unused_indexes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          s.schemaname,
          s.relname as table_name,
          s.indexrelname as index_name,
          s.idx_scan as scans,
          pg_size_pretty(pg_relation_size(s.indexrelid)) as size
        FROM pg_stat_user_indexes s
        JOIN pg_index i ON s.indexrelid = i.indexrelid
        WHERE s.schemaname = 'public'
        AND s.idx_scan = 0
        AND NOT i.indisprimary
        AND NOT i.indisunique
        ORDER BY pg_relation_size(s.indexrelid) DESC
        LIMIT 10
      ) t
    ),
    'most_used_indexes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          s.relname as table_name,
          s.indexrelname as index_name,
          s.idx_scan as scans,
          pg_size_pretty(pg_relation_size(s.indexrelid)) as size
        FROM pg_stat_user_indexes s
        WHERE s.schemaname = 'public'
        AND s.idx_scan > 0
        ORDER BY s.idx_scan DESC
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
