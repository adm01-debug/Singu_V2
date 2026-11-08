CREATE OR REPLACE FUNCTION public.move_deal_atomic(p_deal_id uuid, p_new_stage text, p_new_probability integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_old_stage TEXT;
  v_is_allowed BOOLEAN;
BEGIN
  SELECT pipeline_stage INTO v_old_stage
    FROM public.deals
   WHERE id = p_deal_id AND user_id = auth.uid()
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deal não encontrado: %', p_deal_id;
  END IF;

  SELECT allowed INTO v_is_allowed
    FROM public.pipeline_stage_transitions
   WHERE from_stage = v_old_stage AND to_stage = p_new_stage;
  IF v_is_allowed IS FALSE THEN
    RAISE EXCEPTION 'Transição de % para % não permitida por política de negócio', v_old_stage, p_new_stage;
  END IF;

  UPDATE public.deals
     SET pipeline_stage = p_new_stage,
         probabilidade = COALESCE(p_new_probability, probabilidade),
         updated_at = now()
   WHERE id = p_deal_id;

  RETURN jsonb_build_object('success', true, 'deal_id', p_deal_id, 'from', v_old_stage, 'to', p_new_stage);
END;
$function$
