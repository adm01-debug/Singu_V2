CREATE OR REPLACE FUNCTION public.move_deal_to_stage(p_deal_id uuid, p_new_stage text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old      text;
  v_affected int;
BEGIN
  SELECT pipeline_stage INTO v_old FROM deals WHERE id = p_deal_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal not found or access denied');
  END IF;

  UPDATE deals
  SET pipeline_stage = p_new_stage,
      status = CASE
                 WHEN p_new_stage = 'Ganho'    THEN 'ganho'
                 WHEN p_new_stage = 'Perdido'  THEN 'perdido'
                 ELSE status
               END,
      closed_at  = CASE WHEN p_new_stage IN ('Ganho', 'Perdido') THEN NOW() ELSE closed_at END,
      updated_at = NOW()
  WHERE id = p_deal_id AND user_id = auth.uid();

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  IF v_affected = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal not found or access denied');
  END IF;

  RETURN jsonb_build_object('success', true, 'old_stage', v_old, 'new_stage', p_new_stage);
END;
$function$
