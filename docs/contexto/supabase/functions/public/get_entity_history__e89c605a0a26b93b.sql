CREATE OR REPLACE FUNCTION public.get_entity_history(p_entity_type text, p_entity_id uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(log_id uuid, action text, changed_fields text[], old_value jsonb, new_value jsonb, changed_by text, changed_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    l.id as log_id,
    l.action,
    l.changed_fields,
    l.old_data as old_value,
    l.new_data as new_value,
    p.full_name as changed_by,
    l.created_at as changed_at
  FROM entity_change_logs l
  LEFT JOIN profiles p ON p.id = l.user_id
  WHERE l.entity_type = p_entity_type AND l.entity_id = p_entity_id
  ORDER BY l.created_at DESC
  LIMIT p_limit;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$function$
