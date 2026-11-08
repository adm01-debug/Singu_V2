CREATE OR REPLACE FUNCTION public.get_audit_stats(p_days integer DEFAULT 30)
 RETURNS TABLE(tbl text, action text, cnt bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT table_name, action, COUNT(*) FROM audit_log
  WHERE created_at >= NOW() - (p_days || ' days')::interval
  GROUP BY table_name, action ORDER BY 3 DESC;
$function$
