CREATE OR REPLACE FUNCTION public.get_alert_rules(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(id uuid, name text, description text, rule_type text, is_active boolean, trigger_count integer, last_triggered_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.description,
    r.rule_type,
    r.is_active,
    r.trigger_count,
    r.last_triggered_at
  FROM alert_rules r
  WHERE r.user_id = p_user_id OR r.user_id IS NULL
  ORDER BY r.trigger_count DESC, r.name;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$function$
