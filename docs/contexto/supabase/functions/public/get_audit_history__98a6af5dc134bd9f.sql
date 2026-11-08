CREATE OR REPLACE FUNCTION public.get_audit_history(p_table_name text, p_record_id text, p_limit integer DEFAULT 50)
 RETURNS TABLE(audit_id uuid, action text, old_data jsonb, new_data jsonb, user_name text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT a.id, a.action, a.old_data, a.new_data,
    (SELECT COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = a.user_id),
    a.created_at
  FROM audit_log a
  WHERE a.table_name = p_table_name AND a.record_id = p_record_id
  ORDER BY a.created_at DESC LIMIT p_limit;
$function$
