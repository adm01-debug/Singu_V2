CREATE OR REPLACE FUNCTION public.resolve_sla_violation(p_violation_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_violation_access(p_violation_id);
  UPDATE sla_violations SET is_resolved = true, resolved_at = NOW() WHERE id = p_violation_id;
  RETURN FOUND;
END;
$function$
