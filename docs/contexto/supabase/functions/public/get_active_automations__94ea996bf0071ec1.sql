CREATE OR REPLACE FUNCTION public.get_active_automations(p_trigger_entity text DEFAULT NULL::text, p_trigger_event text DEFAULT NULL::text)
 RETURNS TABLE(automation_id uuid, name text, trigger_type text, trigger_conditions jsonb, actions jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT a.id as automation_id, a.name::text, a.trigger_type::text, a.trigger_conditions, a.actions
  FROM automations a
  WHERE a.is_active = true
    AND (p_trigger_entity IS NULL OR a.trigger_entity = p_trigger_entity)
    AND (p_trigger_event IS NULL OR a.trigger_event = p_trigger_event);
END;
$function$
