CREATE OR REPLACE FUNCTION public.advance_cadence_step(p_cc_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cc company_cadences%ROWTYPE;
  v_cadence sales_cadences%ROWTYPE;
  v_next_step jsonb;
  v_total_steps int;
BEGIN
  PERFORM public.assert_cadence_access(p_cc_id);
  SELECT * INTO v_cc FROM company_cadences WHERE id = p_cc_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Não encontrada'); END IF;
  
  SELECT * INTO v_cadence FROM sales_cadences WHERE id = v_cc.cadence_id;
  v_total_steps := jsonb_array_length(v_cadence.steps);
  
  IF v_cc.current_step >= v_total_steps THEN
    UPDATE company_cadences SET status = 'completed', completed_at = NOW() WHERE id = p_cc_id;
    RETURN jsonb_build_object('status', 'completed');
  END IF;
  
  v_next_step := v_cadence.steps->v_cc.current_step;
  UPDATE company_cadences SET current_step = current_step + 1, 
    next_action_date = CURRENT_DATE + COALESCE((v_next_step->>'day')::int, 0), updated_at = NOW()
  WHERE id = p_cc_id;
  
  RETURN jsonb_build_object('status', 'advanced', 'step', v_cc.current_step + 1);
END;
$function$
