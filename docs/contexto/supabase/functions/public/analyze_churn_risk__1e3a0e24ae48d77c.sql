CREATE OR REPLACE FUNCTION public.analyze_churn_risk(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_last_interaction_date timestamptz;
  v_interaction_count int;
  v_days_since_last int;
  v_risk_score int := 0;
  v_risk_level text;
  v_factors jsonb := '[]'::jsonb;
BEGIN
  -- Última interação
  SELECT MAX(data_interacao), COUNT(*) INTO v_last_interaction_date, v_interaction_count
  FROM interactions WHERE company_id = p_company_id;
  
  IF v_last_interaction_date IS NOT NULL THEN
    v_days_since_last := EXTRACT(DAY FROM NOW() - v_last_interaction_date)::int;
  ELSE
    v_days_since_last := 999;
  END IF;
  
  -- Calcular risco por inatividade
  IF v_days_since_last > 180 THEN
    v_risk_score := v_risk_score + 40;
    v_factors := v_factors || jsonb_build_object('factor', 'inatividade_extrema', 'days', v_days_since_last, 'points', 40);
  ELSIF v_days_since_last > 90 THEN
    v_risk_score := v_risk_score + 25;
    v_factors := v_factors || jsonb_build_object('factor', 'inatividade_alta', 'days', v_days_since_last, 'points', 25);
  ELSIF v_days_since_last > 30 THEN
    v_risk_score := v_risk_score + 10;
    v_factors := v_factors || jsonb_build_object('factor', 'inatividade_moderada', 'days', v_days_since_last, 'points', 10);
  END IF;
  
  -- Risco por poucas interações
  IF v_interaction_count < 3 THEN
    v_risk_score := v_risk_score + 20;
    v_factors := v_factors || jsonb_build_object('factor', 'poucas_interacoes', 'count', v_interaction_count, 'points', 20);
  END IF;
  
  -- Verificar se tem deals perdidos recentes
  IF EXISTS (SELECT 1 FROM deals WHERE company_id = p_company_id AND status = 'perdido' AND closed_at > NOW() - INTERVAL '90 days') THEN
    v_risk_score := v_risk_score + 30;
    v_factors := v_factors || jsonb_build_object('factor', 'deal_perdido_recente', 'points', 30);
  END IF;
  
  -- Determinar nível de risco
  IF v_risk_score >= 70 THEN v_risk_level := 'critical';
  ELSIF v_risk_score >= 50 THEN v_risk_level := 'high';
  ELSIF v_risk_score >= 30 THEN v_risk_level := 'medium';
  ELSE v_risk_level := 'low';
  END IF;
  
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'risk_score', v_risk_score,
    'risk_level', v_risk_level,
    'days_since_last_interaction', v_days_since_last,
    'total_interactions', v_interaction_count,
    'factors', v_factors,
    'analyzed_at', NOW()
  );
END;
$function$
