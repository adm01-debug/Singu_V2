CREATE OR REPLACE FUNCTION public.predict_deal_close_probability(p_deal_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deal deals%ROWTYPE;
  v_probability int := 0;
  v_factors jsonb := '[]'::jsonb;
  v_interaction_count int;
  v_days_in_stage int;
BEGIN
  SELECT * INTO v_deal FROM deals WHERE id = p_deal_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Deal não encontrado'); END IF;
  
  -- Base: probabilidade do estágio
  v_probability := COALESCE(v_deal.probabilidade, 10);
  
  -- Interações recentes
  SELECT COUNT(*) INTO v_interaction_count 
  FROM interactions 
  WHERE company_id = v_deal.company_id AND data_interacao > NOW() - INTERVAL '30 days';
  
  IF v_interaction_count >= 5 THEN v_probability := v_probability + 10; v_factors := v_factors || '{"factor": "interacoes_recentes", "boost": 10}'::jsonb;
  ELSIF v_interaction_count >= 2 THEN v_probability := v_probability + 5; v_factors := v_factors || '{"factor": "algumas_interacoes", "boost": 5}'::jsonb;
  END IF;
  
  -- Proposta enviada
  IF EXISTS (SELECT 1 FROM proposals WHERE deal_id = p_deal_id AND status IN ('sent', 'approved')) THEN
    v_probability := v_probability + 15;
    v_factors := v_factors || '{"factor": "proposta_enviada", "boost": 15}'::jsonb;
  END IF;
  
  -- Limitar a 95%
  v_probability := LEAST(v_probability, 95);
  
  RETURN jsonb_build_object(
    'deal_id', p_deal_id,
    'predicted_probability', v_probability,
    'factors', v_factors
  );
END;
$function$
