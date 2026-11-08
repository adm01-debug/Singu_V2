CREATE OR REPLACE FUNCTION public.get_sla_violations(p_user_id uuid DEFAULT NULL::uuid, p_resolved boolean DEFAULT false)
 RETURNS TABLE(violation_id uuid, rule_name text, entity_type text, entity_id uuid, entity_name text, expected_at timestamp with time zone, hours_overdue numeric, escalation_level integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    sv.id as violation_id,
    sr.name::text as rule_name,
    sv.entity_type::text,
    sv.entity_id,
    CASE sv.entity_type
      WHEN 'company' THEN (SELECT COALESCE(nome_fantasia, nome_crm) FROM companies WHERE id = sv.entity_id)
      WHEN 'deal' THEN (SELECT titulo FROM deals WHERE id = sv.entity_id)
      ELSE ''
    END::text as entity_name,
    sv.expected_at,
    EXTRACT(EPOCH FROM (NOW() - sv.expected_at)) / 3600 as hours_overdue,
    sv.escalation_level
  FROM sla_violations sv
  JOIN sla_rules sr ON sr.id = sv.sla_rule_id
  WHERE sv.is_resolved = p_resolved
    AND (p_user_id IS NULL OR sv.user_id = p_user_id)
  ORDER BY sv.expected_at;
END;
$function$
