CREATE OR REPLACE FUNCTION public.get_all_tags()
 RETURNS TABLE(tag text, usage_count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT UNNEST(tags_array), COUNT(*) FROM companies WHERE deleted_at IS NULL AND tags_array IS NOT NULL GROUP BY 1 ORDER BY 2 DESC;
$function$
