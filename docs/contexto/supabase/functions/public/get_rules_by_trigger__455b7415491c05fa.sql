CREATE OR REPLACE FUNCTION public.get_rules_by_trigger(p_trigger_type text)
 RETURNS TABLE(id uuid, name text, conditions jsonb, actions jsonb, trigger_config jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.name,
    ar.conditions,
    ar.actions,
    ar.trigger_config
  FROM automation_rules ar
  WHERE ar.trigger_type = p_trigger_type
    AND ar.is_active = true
  ORDER BY ar.created_at;
END;
$function$
