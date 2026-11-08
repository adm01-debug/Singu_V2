CREATE OR REPLACE FUNCTION public.check_sla_violations()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count int := 0;
  v_company RECORD;
  v_rule RECORD;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Verificar SLA de leads quentes sem contato
  FOR v_rule IN SELECT * FROM sla_rules WHERE is_active = true AND entity_type = 'company' LOOP
    FOR v_company IN 
      SELECT c.id, c.user_id, c.created_at, c.lead_score
      FROM companies c
      WHERE c.deleted_at IS NULL
        AND c.lead_score >= COALESCE((v_rule.trigger_condition->>'lead_score_min')::int, 0)
        AND NOT EXISTS (
          SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= c.created_at
        )
        AND c.created_at + (v_rule.response_time_hours || ' hours')::interval < NOW()
        AND NOT EXISTS (
          SELECT 1 FROM sla_violations sv WHERE sv.entity_id = c.id AND sv.sla_rule_id = v_rule.id AND sv.is_resolved = false
        )
    LOOP
      INSERT INTO sla_violations (sla_rule_id, entity_type, entity_id, user_id, expected_at)
      VALUES (v_rule.id, 'company', v_company.id, v_company.user_id, v_company.created_at + (v_rule.response_time_hours || ' hours')::interval);
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN v_count;
END;
$function$
