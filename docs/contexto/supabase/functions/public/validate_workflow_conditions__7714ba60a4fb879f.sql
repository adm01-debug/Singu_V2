CREATE OR REPLACE FUNCTION public.validate_workflow_conditions(p_conditions jsonb, p_entity_type text, p_entity_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_results JSONB := '[]'::JSONB;
  v_condition JSONB;
  v_field TEXT;
  v_operator TEXT;
  v_value TEXT;
  v_actual_value TEXT;
  v_met BOOLEAN;
BEGIN
  -- Iterar sobre condições
  FOR v_condition IN SELECT * FROM jsonb_array_elements(p_conditions)
  LOOP
    v_field := v_condition->>'field';
    v_operator := v_condition->>'operator';
    v_value := v_condition->>'value';
    
    -- Buscar valor atual baseado na entidade
    IF p_entity_type = 'company' THEN
      EXECUTE format('SELECT (%s)::TEXT FROM companies WHERE id = $1', v_field)
      INTO v_actual_value USING p_entity_id;
    ELSIF p_entity_type = 'contact' THEN
      EXECUTE format('SELECT (%s)::TEXT FROM contacts WHERE id = $1', v_field)
      INTO v_actual_value USING p_entity_id;
    END IF;
    
    -- Avaliar condição
    v_met := CASE v_operator
      WHEN 'equals' THEN v_actual_value = v_value
      WHEN 'not_equals' THEN v_actual_value != v_value
      WHEN 'contains' THEN v_actual_value ILIKE '%' || v_value || '%'
      WHEN 'is_null' THEN v_actual_value IS NULL
      WHEN 'is_not_null' THEN v_actual_value IS NOT NULL
      ELSE FALSE
    END;
    
    v_results := v_results || jsonb_build_object(
      'field', v_field,
      'operator', v_operator,
      'expected', v_value,
      'actual', v_actual_value,
      'met', v_met
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'conditions', v_results,
    'all_met', NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_results) e WHERE (e->>'met')::BOOLEAN = FALSE)
  );
END;
$function$
