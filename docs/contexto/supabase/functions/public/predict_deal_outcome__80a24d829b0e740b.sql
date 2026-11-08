CREATE OR REPLACE FUNCTION public.predict_deal_outcome(p_deal_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deal deals%ROWTYPE;
  v_days_in_stage int;
  v_interaction_count int;
  v_company_history int;
  v_win_probability numeric;
  v_factors jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO v_deal FROM deals WHERE id = p_deal_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Deal não encontrado'); END IF;
  
  -- Dias no estágio atual
  v_days_in_stage := EXTRACT(DAY FROM NOW() - v_deal.updated_at)::int;
  
  -- Interações recentes
  SELECT COUNT(*) INTO v_interaction_count 
  FROM interactions WHERE company_id = v_deal.company_id AND data_interacao >= NOW() - INTERVAL '30 days';
  
  -- Histórico de ganhos da empresa
  SELECT COUNT(*) INTO v_company_history 
  FROM deals WHERE company_id = v_deal.company_id AND status = 'ganho';
  
  -- Calcular probabilidade base
  v_win_probability := COALESCE(v_deal.probabilidade, 50);
  
  -- Ajustar por fatores
  IF v_days_in_stage > 30 THEN
    v_win_probability := v_win_probability - 15;
    v_factors := v_factors || jsonb_build_object('factor', 'deal_parado', 'impact', -15);
  END IF;
  
  IF v_interaction_count >= 5 THEN
    v_win_probability := v_win_probability + 10;
    v_factors := v_factors || jsonb_build_object('factor', 'engajamento_alto', 'impact', 10);
  ELSIF v_interaction_count = 0 THEN
    v_win_probability := v_win_probability - 20;
    v_factors := v_factors || jsonb_build_object('factor', 'sem_interacao', 'impact', -20);
  END IF;
  
  IF v_company_history > 0 THEN
    v_win_probability := v_win_probability + 15;
    v_factors := v_factors || jsonb_build_object('factor', 'cliente_recorrente', 'impact', 15);
  END IF;
  
  v_win_probability := GREATEST(5, LEAST(95, v_win_probability));
  
  RETURN jsonb_build_object(
    'deal_id', p_deal_id,
    'win_probability', ROUND(v_win_probability, 1),
    'prediction', CASE WHEN v_win_probability >= 70 THEN 'Provável ganho' WHEN v_win_probability >= 40 THEN 'Incerto' ELSE 'Risco de perda' END,
    'factors', v_factors,
    'recommendation', CASE 
      WHEN v_interaction_count = 0 THEN 'Retomar contato urgente'
      WHEN v_days_in_stage > 14 THEN 'Avançar negociação'
      ELSE 'Manter acompanhamento'
    END
  );
END;
$function$
