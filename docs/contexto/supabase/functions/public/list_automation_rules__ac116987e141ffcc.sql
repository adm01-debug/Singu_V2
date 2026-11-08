CREATE OR REPLACE FUNCTION public.list_automation_rules(p_active_only boolean DEFAULT false, p_trigger_type text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, name text, description text, trigger_type text, actions_count integer, is_active boolean, execution_count integer, last_executed_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.name,
    ar.description,
    ar.trigger_type,
    jsonb_array_length(COALESCE(ar.actions, '[]'))::integer,
    ar.is_active,
    COALESCE(ar.execution_count, 0),
    ar.last_executed_at
  FROM automation_rules ar
  WHERE (NOT p_active_only OR ar.is_active = true)
    AND (p_trigger_type IS NULL OR ar.trigger_type = p_trigger_type)
  ORDER BY ar.name;
END;
$function$
