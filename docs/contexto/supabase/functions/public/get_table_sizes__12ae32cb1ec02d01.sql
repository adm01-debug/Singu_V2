CREATE OR REPLACE FUNCTION public.get_table_sizes()
 RETURNS TABLE(table_name text, row_count bigint, total_size text, index_size text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.relname::text as table_name,
    c.reltuples::bigint as row_count,
    pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
    pg_size_pretty(pg_indexes_size(c.oid)) as index_size
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
  ORDER BY pg_total_relation_size(c.oid) DESC
  LIMIT 30;
END;
$function$
