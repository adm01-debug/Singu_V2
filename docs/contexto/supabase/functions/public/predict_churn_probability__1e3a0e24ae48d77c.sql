CREATE OR REPLACE FUNCTION public.predict_churn_probability(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_days_since_last INT;
  v_negative_count INT;
  v_pending_followups INT;
  v_total_interactions INT;
  v_score NUMERIC;
BEGIN
  -- Coletar métricas
  SELECT 
    COALESCE((CURRENT_DATE - MAX(created_at)::DATE), 999),
    COUNT(*) FILTER (WHERE sentiment = 'negativo' AND created_at >= NOW() - INTERVAL '90 days'),
    COUNT(*) FILTER (WHERE follow_up_required AND NOT COALESCE(followup_concluido, FALSE)),
    COUNT(*)
  INTO v_days_since_last, v_negative_count, v_pending_followups, v_total_interactions
  FROM interactions WHERE company_id = p_company_id;
  
  -- Calcular score (0-100, maior = mais risco)
  v_score := 0;
  v_score := v_score + LEAST(v_days_since_last, 90) * 0.5; -- Max 45 pontos por inatividade
  v_score := v_score + LEAST(v_negative_count * 10, 30); -- Max 30 pontos por sentimento negativo
  v_score := v_score + LEAST(v_pending_followups * 5, 15); -- Max 15 pontos por pendências
  v_score := v_score + CASE WHEN v_total_interactions < 5 THEN 10 ELSE 0 END; -- 10 pontos se baixo histórico
  
  v_score := LEAST(v_score, 100);
  
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'churn_probability_pct', ROUND(v_score, 1),
    'risk_level', CASE 
      WHEN v_score >= 70 THEN 'crítico'
      WHEN v_score >= 50 THEN 'alto'
      WHEN v_score >= 30 THEN 'médio'
      ELSE 'baixo'
    END,
    'factors', jsonb_build_object(
      'days_since_last_contact', v_days_since_last,
      'negative_sentiment_90d', v_negative_count,
      'pending_followups', v_pending_followups,
      'total_interactions', v_total_interactions
    ),
    'recommendations', CASE 
      WHEN v_score >= 70 THEN ARRAY['Ação imediata necessária', 'Escalar para gerente', 'Oferecer desconto ou benefício']
      WHEN v_score >= 50 THEN ARRAY['Agendar reunião', 'Resolver pendências', 'Pesquisa de satisfação']
      WHEN v_score >= 30 THEN ARRAY['Ligação de relacionamento', 'Enviar conteúdo relevante']
      ELSE ARRAY['Manter contato regular']
    END
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
