-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260401192952
-- nome:   create_rpc_recalculate_rfm_for_company

-- =============================================================
-- RPC: recalculate_rfm_for_company
-- Recalcula scores RFM de uma empresa específica baseado nas
-- interações reais. Chamado automaticamente pelo sync.
-- =============================================================
CREATE OR REPLACE FUNCTION public.recalculate_rfm_for_company(p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_last_date TIMESTAMPTZ;
  v_count INT;
  v_total NUMERIC;
  v_recency INT;
  v_frequency INT;
  v_monetary INT;
  v_combined NUMERIC;
  v_segment TEXT;
  v_days_since INT;
BEGIN
  -- Get interaction stats for this company
  SELECT 
    MAX(i.data_interacao),
    COUNT(*)::INT,
    COALESCE(SUM(CASE WHEN cu.valor_total_compras > 0 THEN cu.valor_total_compras ELSE 0 END), 0)
  INTO v_last_date, v_count, v_total
  FROM interactions i
  LEFT JOIN customers cu ON cu.company_id = p_company_id AND cu.deleted_at IS NULL
  WHERE i.company_id = p_company_id;

  -- Get total from customers table if interactions don't have value
  IF v_total = 0 THEN
    SELECT COALESCE(cu.valor_total_compras, 0) INTO v_total
    FROM customers cu WHERE cu.company_id = p_company_id AND cu.deleted_at IS NULL LIMIT 1;
  END IF;

  v_days_since := COALESCE(EXTRACT(DAY FROM NOW() - v_last_date)::INT, 999);

  -- Score Recency (1-5)
  v_recency := CASE
    WHEN v_days_since <= 7 THEN 5
    WHEN v_days_since <= 30 THEN 4
    WHEN v_days_since <= 90 THEN 3
    WHEN v_days_since <= 180 THEN 2
    ELSE 1
  END;

  -- Score Frequency (1-5)
  v_frequency := CASE
    WHEN v_count >= 20 THEN 5
    WHEN v_count >= 10 THEN 4
    WHEN v_count >= 5 THEN 3
    WHEN v_count >= 2 THEN 2
    ELSE 1
  END;

  -- Score Monetary (1-5)
  v_monetary := CASE
    WHEN v_total >= 50000 THEN 5
    WHEN v_total >= 20000 THEN 4
    WHEN v_total >= 5000 THEN 3
    WHEN v_total >= 1000 THEN 2
    ELSE 1
  END;

  v_combined := (v_recency + v_frequency + v_monetary)::NUMERIC / 3;

  -- Determine segment
  v_segment := CASE
    WHEN v_recency >= 4 AND v_frequency >= 4 AND v_monetary >= 4 THEN 'Champions'
    WHEN v_recency >= 3 AND v_frequency >= 3 AND v_monetary >= 3 THEN 'Loyal Customers'
    WHEN v_recency >= 4 AND v_frequency >= 2 THEN 'Potential Loyalist'
    WHEN v_recency >= 4 AND v_frequency = 1 THEN 'Recent Customers'
    WHEN v_recency >= 3 AND v_frequency >= 1 AND v_monetary >= 1 THEN 'Promising'
    WHEN v_recency = 2 AND v_frequency >= 2 THEN 'Need Attention'
    WHEN v_recency = 2 AND v_frequency = 1 THEN 'About to Sleep'
    WHEN v_recency = 1 AND v_frequency >= 3 THEN 'At Risk'
    WHEN v_recency = 1 AND v_frequency >= 1 AND v_monetary >= 2 THEN E'Can''t Lose Them'
    WHEN v_recency = 1 AND v_frequency = 1 AND v_monetary = 1 AND v_count > 0 THEN 'Hibernating'
    ELSE 'Lost'
  END;

  -- Upsert RFM score (use first user_id from profiles as default)
  INSERT INTO company_rfm_scores (
    user_id, company_id, last_interaction_date, interaction_count,
    total_value, recency_score, frequency_score, monetary_score,
    combined_score, segment_code, calculated_at, updated_at
  ) VALUES (
    (SELECT id FROM profiles LIMIT 1),
    p_company_id, v_last_date, v_count,
    v_total, v_recency, v_frequency, v_monetary,
    v_combined, v_segment, NOW(), NOW()
  )
  ON CONFLICT (user_id, company_id) 
  DO UPDATE SET
    last_interaction_date = EXCLUDED.last_interaction_date,
    interaction_count = EXCLUDED.interaction_count,
    total_value = EXCLUDED.total_value,
    recency_score = EXCLUDED.recency_score,
    frequency_score = EXCLUDED.frequency_score,
    monetary_score = EXCLUDED.monetary_score,
    combined_score = EXCLUDED.combined_score,
    segment_code = EXCLUDED.segment_code,
    calculated_at = NOW(),
    updated_at = NOW();

  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'recency', v_recency,
    'frequency', v_frequency,
    'monetary', v_monetary,
    'combined', v_combined,
    'segment', v_segment,
    'days_since_last', v_days_since,
    'interaction_count', v_count
  );
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.recalculate_rfm_for_company(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.recalculate_rfm_for_company(UUID) TO authenticated;
