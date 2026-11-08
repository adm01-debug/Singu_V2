CREATE OR REPLACE FUNCTION public.recalculate_rfm_for_company(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_recency int;
  v_frequency int;
  v_monetary numeric;
  v_r_score int;
  v_f_score int;
  v_m_score int;
  v_combined_score numeric;
  v_last_interaction timestamptz;
  v_user_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  -- Obter user_id da empresa
  SELECT user_id INTO v_user_id FROM companies WHERE id = p_company_id;
  
  -- Recência: dias desde última interação
  SELECT MAX(data_interacao) INTO v_last_interaction FROM interactions WHERE company_id = p_company_id;
  v_recency := COALESCE(EXTRACT(DAY FROM NOW() - v_last_interaction)::int, 999);
  
  -- Frequência: total de interações no último ano
  SELECT COUNT(*) INTO v_frequency
  FROM interactions WHERE company_id = p_company_id AND data_interacao > NOW() - INTERVAL '1 year';
  
  -- Monetário: valor total de deals ganhos
  SELECT COALESCE(SUM(valor), 0) INTO v_monetary
  FROM deals WHERE company_id = p_company_id AND status = 'ganho';
  
  -- Calcular scores (1-5)
  v_r_score := CASE WHEN v_recency <= 7 THEN 5 WHEN v_recency <= 30 THEN 4 WHEN v_recency <= 90 THEN 3 WHEN v_recency <= 180 THEN 2 ELSE 1 END;
  v_f_score := CASE WHEN v_frequency >= 20 THEN 5 WHEN v_frequency >= 10 THEN 4 WHEN v_frequency >= 5 THEN 3 WHEN v_frequency >= 2 THEN 2 ELSE 1 END;
  v_m_score := CASE WHEN v_monetary >= 100000 THEN 5 WHEN v_monetary >= 50000 THEN 4 WHEN v_monetary >= 10000 THEN 3 WHEN v_monetary >= 1000 THEN 2 ELSE 1 END;
  
  -- Combined score = MÉDIA (1-5), não soma
  v_combined_score := ROUND((v_r_score + v_f_score + v_m_score)::numeric / 3, 2);
  
  -- Upsert RFM score
  INSERT INTO company_rfm_scores (
    company_id, user_id, last_interaction_date, interaction_count, total_value,
    recency_score, frequency_score, monetary_score, combined_score, calculated_at
  )
  VALUES (
    p_company_id, v_user_id, v_last_interaction, v_frequency, v_monetary,
    v_r_score, v_f_score, v_m_score, v_combined_score, NOW()
  )
  ON CONFLICT (company_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    last_interaction_date = EXCLUDED.last_interaction_date,
    interaction_count = EXCLUDED.interaction_count,
    total_value = EXCLUDED.total_value,
    recency_score = EXCLUDED.recency_score,
    frequency_score = EXCLUDED.frequency_score,
    monetary_score = EXCLUDED.monetary_score,
    combined_score = EXCLUDED.combined_score,
    calculated_at = NOW(),
    updated_at = NOW();
  
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'recency_days', v_recency,
    'frequency', v_frequency,
    'monetary', v_monetary,
    'r_score', v_r_score,
    'f_score', v_f_score,
    'm_score', v_m_score,
    'combined_score', v_combined_score
  );
END;
$function$
