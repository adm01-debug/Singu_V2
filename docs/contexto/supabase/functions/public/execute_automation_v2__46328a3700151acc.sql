CREATE OR REPLACE FUNCTION public.execute_automation_v2(p_rule_id uuid, p_entity_type text, p_entity_id uuid, p_input_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rule automation_rules%ROWTYPE;
  v_execution_id uuid;
  v_start_time timestamptz;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  v_start_time := clock_timestamp();
  
  SELECT * INTO v_rule FROM automation_rules WHERE id = p_rule_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Regra não encontrada ou inativa');
  END IF;
  
  INSERT INTO automation_executions (rule_id, trigger_type, entity_type, entity_id, input_data, status)
  VALUES (p_rule_id, v_rule.trigger_type, p_entity_type, p_entity_id, p_input_data, 'running')
  RETURNING id INTO v_execution_id;
  
  UPDATE automation_executions
  SET status = 'completed',
      actions_executed = v_rule.actions,
      execution_time_ms = EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::integer
  WHERE id = v_execution_id;
  
  UPDATE automation_rules
  SET execution_count = COALESCE(execution_count, 0) + 1,
      last_executed_at = now()
  WHERE id = p_rule_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'execution_id', v_execution_id,
    'rule_name', v_rule.name
  );
END;
$function$
