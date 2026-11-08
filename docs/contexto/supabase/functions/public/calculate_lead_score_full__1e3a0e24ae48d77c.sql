CREATE OR REPLACE FUNCTION public.calculate_lead_score_full(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company companies%ROWTYPE;
  v_engagement_score integer := 0;
  v_fit_score integer := 0;
  v_behavior_score integer := 0;
  v_total_score integer;
  v_factors jsonb := '{}';
  v_interaction_count integer;
  v_last_interaction timestamptz;
  v_deal_count integer;
  v_contact_count integer;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  SELECT * INTO v_company FROM companies WHERE id = p_company_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Empresa não encontrada');
  END IF;
  
  -- Dados auxiliares
  SELECT COUNT(*), MAX(data_interacao) INTO v_interaction_count, v_last_interaction
  FROM interactions WHERE company_id = p_company_id;
  
  SELECT COUNT(*) INTO v_deal_count FROM deals WHERE company_id = p_company_id;
  SELECT COUNT(*) INTO v_contact_count FROM contacts WHERE company_id = p_company_id;
  
  -- ENGAGEMENT SCORE (0-40)
  -- Baseado em interações recentes
  IF v_interaction_count >= 10 THEN v_engagement_score := v_engagement_score + 15;
  ELSIF v_interaction_count >= 5 THEN v_engagement_score := v_engagement_score + 10;
  ELSIF v_interaction_count >= 1 THEN v_engagement_score := v_engagement_score + 5;
  END IF;
  v_factors := v_factors || jsonb_build_object('interactions', v_interaction_count);
  
  -- Recência da última interação
  IF v_last_interaction IS NOT NULL THEN
    IF v_last_interaction > NOW() - INTERVAL '7 days' THEN v_engagement_score := v_engagement_score + 15;
    ELSIF v_last_interaction > NOW() - INTERVAL '30 days' THEN v_engagement_score := v_engagement_score + 10;
    ELSIF v_last_interaction > NOW() - INTERVAL '90 days' THEN v_engagement_score := v_engagement_score + 5;
    END IF;
    v_factors := v_factors || jsonb_build_object('days_since_interaction', EXTRACT(DAY FROM NOW() - v_last_interaction)::integer);
  END IF;
  
  -- Múltiplos canais
  IF (SELECT COUNT(DISTINCT channel) FROM interactions WHERE company_id = p_company_id) >= 3 THEN
    v_engagement_score := v_engagement_score + 10;
  END IF;
  
  -- FIT SCORE (0-30)
  -- Status
  IF v_company.status = 'ativo' THEN v_fit_score := v_fit_score + 10; END IF;
  
  -- Tem CNPJ válido
  IF v_company.cnpj IS NOT NULL AND LENGTH(v_company.cnpj) >= 14 THEN
    v_fit_score := v_fit_score + 5;
  END IF;
  
  -- Tem contatos cadastrados
  IF v_contact_count >= 3 THEN v_fit_score := v_fit_score + 10;
  ELSIF v_contact_count >= 1 THEN v_fit_score := v_fit_score + 5;
  END IF;
  v_factors := v_factors || jsonb_build_object('contacts', v_contact_count);
  
  -- Dados completos
  IF v_company.email IS NOT NULL THEN v_fit_score := v_fit_score + 2; END IF;
  IF v_company.telefone IS NOT NULL THEN v_fit_score := v_fit_score + 3; END IF;
  
  -- BEHAVIOR SCORE (0-30)
  -- Tem deals
  IF v_deal_count >= 3 THEN v_behavior_score := v_behavior_score + 15;
  ELSIF v_deal_count >= 1 THEN v_behavior_score := v_behavior_score + 10;
  END IF;
  v_factors := v_factors || jsonb_build_object('deals', v_deal_count);
  
  -- Já é cliente
  IF v_company.is_customer THEN v_behavior_score := v_behavior_score + 10; END IF;
  
  -- Lead score já atribuído
  IF v_company.lead_score IS NOT NULL AND v_company.lead_score > 0 THEN
    v_behavior_score := v_behavior_score + 5;
  END IF;
  
  -- Calcular total
  v_total_score := v_engagement_score + v_fit_score + v_behavior_score;
  
  -- Salvar histórico
  INSERT INTO lead_score_history (company_id, lead_score, engagement_score, fit_score, behavior_score, factors)
  VALUES (p_company_id, v_total_score, v_engagement_score, v_fit_score, v_behavior_score, v_factors)
  ON CONFLICT (company_id, score_date) DO UPDATE SET
    lead_score = v_total_score,
    engagement_score = v_engagement_score,
    fit_score = v_fit_score,
    behavior_score = v_behavior_score,
    factors = v_factors;
  
  -- Atualizar lead_score na empresa
  UPDATE companies SET lead_score = v_total_score WHERE id = p_company_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'company_id', p_company_id,
    'total_score', v_total_score,
    'engagement_score', v_engagement_score,
    'fit_score', v_fit_score,
    'behavior_score', v_behavior_score,
    'grade', CASE 
      WHEN v_total_score >= 80 THEN 'A'
      WHEN v_total_score >= 60 THEN 'B'
      WHEN v_total_score >= 40 THEN 'C'
      WHEN v_total_score >= 20 THEN 'D'
      ELSE 'F'
    END,
    'factors', v_factors
  );
END;
$function$
