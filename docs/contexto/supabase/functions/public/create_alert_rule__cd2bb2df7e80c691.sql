CREATE OR REPLACE FUNCTION public.create_alert_rule(p_name text, p_rule_type text, p_conditions jsonb, p_description text DEFAULT NULL::text, p_actions jsonb DEFAULT '{"notify": true}'::jsonb, p_is_active boolean DEFAULT true, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rule_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO alert_rules (name, description, rule_type, conditions, actions, is_active, user_id)
  VALUES (p_name, p_description, p_rule_type, p_conditions, p_actions, p_is_active, p_user_id)
  RETURNING id INTO v_rule_id;
  
  RETURN v_rule_id;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS alert_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    rule_type text NOT NULL,
    conditions jsonb NOT NULL,
    actions jsonb DEFAULT '{"notify": true}'::jsonb,
    is_active boolean DEFAULT true,
    user_id uuid REFERENCES profiles(id),
    last_triggered_at timestamptz,
    trigger_count int DEFAULT 0,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
  );
  
  INSERT INTO alert_rules (name, description, rule_type, conditions, actions, is_active, user_id)
  VALUES (p_name, p_description, p_rule_type, p_conditions, p_actions, p_is_active, p_user_id)
  RETURNING id INTO v_rule_id;
  
  RETURN v_rule_id;
END;
$function$
