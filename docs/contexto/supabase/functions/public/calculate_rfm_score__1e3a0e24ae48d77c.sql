CREATE OR REPLACE FUNCTION public.calculate_rfm_score(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_recency int;
  v_frequency int;
  v_monetary numeric;
  v_r_score int;
  v_f_score int;
  v_m_score int;
BEGIN
  SELECT EXTRACT(DAY FROM NOW() - MAX(data_interacao))::int INTO v_recency FROM interactions WHERE company_id = p_company_id;
  SELECT COUNT(*)::int INTO v_frequency FROM interactions WHERE company_id = p_company_id;
  SELECT COALESCE(SUM(valor), 0) INTO v_monetary FROM deals WHERE company_id = p_company_id AND status = 'ganho';
  
  v_r_score := CASE WHEN v_recency IS NULL THEN 1 WHEN v_recency <= 7 THEN 5 WHEN v_recency <= 30 THEN 4 WHEN v_recency <= 60 THEN 3 WHEN v_recency <= 90 THEN 2 ELSE 1 END;
  v_f_score := CASE WHEN v_frequency >= 20 THEN 5 WHEN v_frequency >= 10 THEN 4 WHEN v_frequency >= 5 THEN 3 WHEN v_frequency >= 2 THEN 2 ELSE 1 END;
  v_m_score := CASE WHEN v_monetary >= 50000 THEN 5 WHEN v_monetary >= 20000 THEN 4 WHEN v_monetary >= 5000 THEN 3 WHEN v_monetary >= 1000 THEN 2 ELSE 1 END;
  
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'recency_days', v_recency,
    'frequency', v_frequency,
    'monetary', v_monetary,
    'r_score', v_r_score,
    'f_score', v_f_score,
    'm_score', v_m_score,
    'rfm_score', v_r_score || v_f_score || v_m_score,
    'segment', CASE 
      WHEN v_r_score >= 4 AND v_f_score >= 4 AND v_m_score >= 4 THEN 'Champions'
      WHEN v_r_score >= 3 AND v_f_score >= 3 THEN 'Loyal'
      WHEN v_r_score >= 4 THEN 'Recent'
      WHEN v_f_score >= 4 THEN 'Frequent'
      WHEN v_m_score >= 4 THEN 'Big Spenders'
      WHEN v_r_score <= 2 AND v_f_score >= 3 THEN 'At Risk'
      WHEN v_r_score <= 2 THEN 'Hibernating'
      ELSE 'Potential'
    END
  );
END;
$function$
