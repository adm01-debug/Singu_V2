CREATE OR REPLACE FUNCTION public.compare_periods_detailed(p_metric text DEFAULT 'revenue'::text, p_period1_start date DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date, p_period1_end date DEFAULT CURRENT_DATE, p_period2_start date DEFAULT ((date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '1 mon'::interval))::date, p_period2_end date DEFAULT ((date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) - '1 day'::interval))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_period1_value numeric;
  v_period2_value numeric;
  v_change_pct numeric;
BEGIN
  IF p_metric = 'revenue' THEN
    SELECT COALESCE(SUM(valor), 0) INTO v_period1_value FROM deals WHERE status = 'ganho' AND closed_at::date BETWEEN p_period1_start AND p_period1_end;
    SELECT COALESCE(SUM(valor), 0) INTO v_period2_value FROM deals WHERE status = 'ganho' AND closed_at::date BETWEEN p_period2_start AND p_period2_end;
  ELSIF p_metric = 'deals' THEN
    SELECT COUNT(*) INTO v_period1_value FROM deals WHERE status = 'ganho' AND closed_at::date BETWEEN p_period1_start AND p_period1_end;
    SELECT COUNT(*) INTO v_period2_value FROM deals WHERE status = 'ganho' AND closed_at::date BETWEEN p_period2_start AND p_period2_end;
  ELSIF p_metric = 'interactions' THEN
    SELECT COUNT(*) INTO v_period1_value FROM interactions WHERE data_interacao::date BETWEEN p_period1_start AND p_period1_end;
    SELECT COUNT(*) INTO v_period2_value FROM interactions WHERE data_interacao::date BETWEEN p_period2_start AND p_period2_end;
  ELSIF p_metric = 'leads' THEN
    SELECT COUNT(*) INTO v_period1_value FROM companies WHERE created_at::date BETWEEN p_period1_start AND p_period1_end AND is_customer = false;
    SELECT COUNT(*) INTO v_period2_value FROM companies WHERE created_at::date BETWEEN p_period2_start AND p_period2_end AND is_customer = false;
  END IF;
  
  v_change_pct := CASE WHEN v_period2_value > 0 THEN ROUND(((v_period1_value - v_period2_value) / v_period2_value) * 100, 1) ELSE 0 END;
  
  RETURN jsonb_build_object(
    'metric', p_metric,
    'period1', jsonb_build_object('start', p_period1_start, 'end', p_period1_end, 'value', v_period1_value),
    'period2', jsonb_build_object('start', p_period2_start, 'end', p_period2_end, 'value', v_period2_value),
    'change_value', v_period1_value - v_period2_value,
    'change_pct', v_change_pct,
    'trend', CASE WHEN v_change_pct > 5 THEN 'up' WHEN v_change_pct < -5 THEN 'down' ELSE 'stable' END
  );
END;
$function$
