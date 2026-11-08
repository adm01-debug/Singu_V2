CREATE OR REPLACE FUNCTION public.create_automation_rule_v2(p_name text, p_trigger_type text, p_actions jsonb, p_description text DEFAULT NULL::text, p_conditions jsonb DEFAULT '{}'::jsonb, p_trigger_config jsonb DEFAULT '{}'::jsonb, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rule_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO automation_rules (name, description, trigger_type, trigger_config, conditions, actions, user_id, is_active)
  VALUES (p_name, p_description, p_trigger_type, p_trigger_config, p_conditions, p_actions, p_user_id, true)
  RETURNING id INTO v_rule_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'rule_id', v_rule_id,
    'message', 'Regra de automação criada com sucesso'
  );
END;
$function$
