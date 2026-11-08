CREATE OR REPLACE FUNCTION public.get_opportunity_score(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_score INT := 0;
  v_factors TEXT[] := '{}';
BEGIN
  -- Fator: Engajamento recente
  IF EXISTS (SELECT 1 FROM interactions WHERE company_id = p_company_id AND created_at >= NOW() - INTERVAL '7 days') THEN
    v_score := v_score + 20;
    v_factors := array_append(v_factors, 'Engajamento recente');
  END IF;
  
  -- Fator: Sentimento positivo
  IF (SELECT COUNT(*) FILTER (WHERE sentiment = 'positivo') > COUNT(*) FILTER (WHERE sentiment = 'negativo') 
      FROM interactions WHERE company_id = p_company_id AND created_at >= NOW() - INTERVAL '30 days') THEN
    v_score := v_score + 15;
    v_factors := array_append(v_factors, 'Sentimento positivo');
  END IF;
  
  -- Fator: Empresa com muitos contatos
  IF (SELECT COUNT(*) FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL) >= 3 THEN
    v_score := v_score + 10;
    v_factors := array_append(v_factors, 'Múltiplos contatos');
  END IF;
  
  -- Fator: Histórico de interações
  IF (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id) >= 10 THEN
    v_score := v_score + 15;
    v_factors := array_append(v_factors, 'Histórico robusto');
  END IF;
  
  -- Fator: Dados completos
  IF (SELECT cnpj IS NOT NULL AND ramo_atividade IS NOT NULL FROM companies WHERE id = p_company_id) THEN
    v_score := v_score + 10;
    v_factors := array_append(v_factors, 'Dados completos');
  END IF;
  
  -- Fator: Tamanho da empresa
  IF (SELECT employee_count IN ('51-100', '101-500', '500+') FROM companies WHERE id = p_company_id) THEN
    v_score := v_score + 15;
    v_factors := array_append(v_factors, 'Empresa de porte');
  END IF;
  
  -- Fator: Sem followups pendentes
  IF NOT EXISTS (
    SELECT 1 FROM interactions WHERE company_id = p_company_id 
    AND follow_up_required AND NOT COALESCE(followup_concluido, FALSE)
  ) THEN
    v_score := v_score + 15;
    v_factors := array_append(v_factors, 'Sem pendências');
  END IF;
  
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'opportunity_score', v_score,
    'rating', CASE 
      WHEN v_score >= 80 THEN 'hot'
      WHEN v_score >= 50 THEN 'warm'
      WHEN v_score >= 25 THEN 'cool'
      ELSE 'cold'
    END,
    'positive_factors', v_factors,
    'recommendation', CASE 
      WHEN v_score >= 80 THEN 'Priorizar contato comercial imediato'
      WHEN v_score >= 50 THEN 'Bom momento para proposta'
      WHEN v_score >= 25 THEN 'Nutrir relacionamento antes de proposta'
      ELSE 'Trabalhar engagement primeiro'
    END
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
