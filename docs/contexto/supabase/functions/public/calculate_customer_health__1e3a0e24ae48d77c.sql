CREATE OR REPLACE FUNCTION public.calculate_customer_health(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company companies%ROWTYPE;
  v_health_score integer := 0;
  v_engagement_level text;
  v_relationship_score integer := 0;
  v_interaction_count integer;
  v_last_interaction timestamptz;
  v_days_since_interaction integer;
  v_deal_won_count integer;
  v_deal_total_value numeric;
  v_risk_factors jsonb := '[]';
  v_recommended_actions jsonb := '[]';
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  SELECT * INTO v_company FROM companies WHERE id = p_company_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Empresa não encontrada');
  END IF;
  
  -- Dados auxiliares
  SELECT COUNT(*), MAX(data_interacao) INTO v_interaction_count, v_last_interaction
  FROM interactions WHERE company_id = p_company_id;
  
  SELECT COUNT(*), COALESCE(SUM(valor), 0) INTO v_deal_won_count, v_deal_total_value
  FROM deals WHERE company_id = p_company_id AND status = 'ganho';
  
  v_days_since_interaction := CASE 
    WHEN v_last_interaction IS NULL THEN 999
    ELSE EXTRACT(DAY FROM NOW() - v_last_interaction)::integer
  END;
  
  -- RELATIONSHIP SCORE (0-40)
  IF v_interaction_count >= 20 THEN v_relationship_score := 40;
  ELSIF v_interaction_count >= 10 THEN v_relationship_score := 30;
  ELSIF v_interaction_count >= 5 THEN v_relationship_score := 20;
  ELSIF v_interaction_count >= 1 THEN v_relationship_score := 10;
  END IF;
  
  -- Penalidade por inatividade
  IF v_days_since_interaction > 90 THEN
    v_relationship_score := GREATEST(0, v_relationship_score - 20);
    v_risk_factors := v_risk_factors || jsonb_build_array('Sem interação há mais de 90 dias');
    v_recommended_actions := v_recommended_actions || jsonb_build_array('Agendar call de follow-up urgente');
  ELSIF v_days_since_interaction > 30 THEN
    v_relationship_score := GREATEST(0, v_relationship_score - 10);
    v_risk_factors := v_risk_factors || jsonb_build_array('Sem interação há mais de 30 dias');
    v_recommended_actions := v_recommended_actions || jsonb_build_array('Enviar email de relacionamento');
  END IF;
  
  -- VALOR DO CLIENTE (0-30)
  IF v_deal_total_value >= 100000 THEN v_health_score := v_health_score + 30;
  ELSIF v_deal_total_value >= 50000 THEN v_health_score := v_health_score + 25;
  ELSIF v_deal_total_value >= 10000 THEN v_health_score := v_health_score + 20;
  ELSIF v_deal_total_value > 0 THEN v_health_score := v_health_score + 10;
  END IF;
  
  -- STATUS (0-15)
  IF v_company.status = 'ativo' THEN v_health_score := v_health_score + 15;
  ELSIF v_company.status = 'suspenso' THEN 
    v_health_score := v_health_score + 5;
    v_risk_factors := v_risk_factors || jsonb_build_array('Status suspenso');
  END IF;
  
  -- É CLIENTE (0-15)
  IF v_company.is_customer THEN v_health_score := v_health_score + 15;
  ELSE
    v_recommended_actions := v_recommended_actions || jsonb_build_array('Converter para cliente');
  END IF;
  
  -- Adicionar relationship score
  v_health_score := v_health_score + v_relationship_score;
  
  -- Determinar nível de engajamento
  v_engagement_level := CASE
    WHEN v_health_score >= 80 THEN 'high'
    WHEN v_health_score >= 60 THEN 'medium'
    WHEN v_health_score >= 40 THEN 'low'
    ELSE 'at_risk'
  END;
  
  -- Salvar histórico
  INSERT INTO customer_health_scores (
    company_id, health_score, engagement_level, relationship_score,
    risk_factors, recommended_actions
  ) VALUES (
    p_company_id, v_health_score, v_engagement_level, v_relationship_score,
    v_risk_factors, v_recommended_actions
  )
  ON CONFLICT (company_id, score_date) DO UPDATE SET
    health_score = v_health_score,
    engagement_level = v_engagement_level,
    relationship_score = v_relationship_score,
    risk_factors = v_risk_factors,
    recommended_actions = v_recommended_actions;
  
  RETURN jsonb_build_object(
    'success', true,
    'company_id', p_company_id,
    'health_score', v_health_score,
    'engagement_level', v_engagement_level,
    'relationship_score', v_relationship_score,
    'days_since_interaction', v_days_since_interaction,
    'total_value', v_deal_total_value,
    'risk_factors', v_risk_factors,
    'recommended_actions', v_recommended_actions
  );
END;
$function$
