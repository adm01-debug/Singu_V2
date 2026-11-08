CREATE OR REPLACE FUNCTION public.get_kpi_summary(p_user_id uuid DEFAULT NULL::uuid, p_period text DEFAULT 'month'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_start_date date;
  v_companies_new int;
  v_interactions_total int;
  v_deals_won int;
  v_deals_value numeric;
  v_avg_response_time interval;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  v_start_date := CASE p_period
    WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
    WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
    WHEN 'quarter' THEN CURRENT_DATE - INTERVAL '90 days'
    ELSE CURRENT_DATE - INTERVAL '30 days'
  END;
  
  SELECT COUNT(*) INTO v_companies_new
  FROM companies WHERE created_at >= v_start_date AND deleted_at IS NULL
    AND (p_user_id IS NULL OR user_id = p_user_id);
  
  SELECT COUNT(*) INTO v_interactions_total
  FROM interactions WHERE data_interacao >= v_start_date
    AND (p_user_id IS NULL OR user_id = p_user_id);
  
  SELECT COUNT(*), COALESCE(SUM(valor), 0)
  INTO v_deals_won, v_deals_value
  FROM deals WHERE status = 'ganho' AND updated_at >= v_start_date
    AND (p_user_id IS NULL OR user_id = p_user_id);

  v_result := jsonb_build_object(
    'period', p_period,
    'start_date', v_start_date,
    'companies_new', v_companies_new,
    'interactions_total', v_interactions_total,
    'deals_won', v_deals_won,
    'deals_value', v_deals_value,
    'avg_interactions_per_day', ROUND(v_interactions_total::numeric / GREATEST(EXTRACT(DAY FROM NOW() - v_start_date), 1), 2),
    'calculated_at', NOW()
  );
  
  RETURN v_result;
END;
$function$
