CREATE OR REPLACE FUNCTION public.evaluate_alert_rules(p_user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rule record;
  v_alerts jsonb := '[]'::jsonb;
  v_count int;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  FOR v_rule IN 
    SELECT * FROM alert_rules 
    WHERE (p_user_id = ANY(user_ids) OR user_ids IS NULL OR cardinality(user_ids) = 0) 
    AND is_active = true
  LOOP
    CASE v_rule.trigger_entity
      WHEN 'company' THEN
        CASE v_rule.trigger_condition->>'type'
          WHEN 'inactivity' THEN
            SELECT COUNT(*) INTO v_count
            FROM companies c
            WHERE c.user_id = p_user_id
              AND c.status = 'ativo'
              AND NOT EXISTS (
                SELECT 1 FROM interactions i 
                WHERE i.company_id = c.id 
                AND i.data_interacao >= NOW() - ((v_rule.trigger_condition->>'days')::int || ' days')::interval
              );
            
            IF v_count > 0 THEN
              v_alerts := v_alerts || jsonb_build_object(
                'rule_id', v_rule.id,
                'rule_name', v_rule.rule_name,
                'type', 'inactivity',
                'count', v_count,
                'message', v_count || ' empresas sem interação'
              );
            END IF;
          ELSE NULL;
        END CASE;
        
      WHEN 'interaction' THEN
        SELECT COUNT(*) INTO v_count
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        WHERE c.user_id = p_user_id
          AND i.follow_up_date IS NOT NULL
          AND i.follow_up_date <= CURRENT_DATE;
        
        IF v_count > 0 THEN
          v_alerts := v_alerts || jsonb_build_object(
            'rule_id', v_rule.id,
            'rule_name', v_rule.rule_name,
            'type', 'followup',
            'count', v_count,
            'message', v_count || ' followups pendentes'
          );
        END IF;
      ELSE NULL;
    END CASE;
  END LOOP;
  
  RETURN jsonb_build_object('alerts', v_alerts, 'total', jsonb_array_length(v_alerts), 'evaluated_at', NOW());
EXCEPTION WHEN undefined_table THEN
  RETURN jsonb_build_object('alerts', '[]'::jsonb, 'total', 0);
END;
$function$
