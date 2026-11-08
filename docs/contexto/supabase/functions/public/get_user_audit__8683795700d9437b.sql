CREATE OR REPLACE FUNCTION public.get_user_audit(p_user_id uuid, p_days integer DEFAULT 30)
 RETURNS TABLE(audit_id uuid, action text, table_name text, record_id text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id, action, table_name, record_id, created_at
  FROM audit_log WHERE user_id = p_user_id AND created_at >= NOW() - (p_days || ' days')::interval
  ORDER BY created_at DESC;
$function$
