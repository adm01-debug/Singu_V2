CREATE OR REPLACE FUNCTION public.generate_historical_forecast(p_months_ahead integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_avg_monthly numeric;
  v_growth_rate numeric;
  v_result jsonb := '[]';
  v_month date;
  v_forecast numeric;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Média dos últimos 6 meses
  SELECT COALESCE(AVG(monthly_total), 0)
  INTO v_avg_monthly
  FROM (
    SELECT DATE_TRUNC('month', closed_at) as month, SUM(valor) as monthly_total
    FROM deals
    WHERE status = 'ganho' AND closed_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', closed_at)
  ) m;
  
  -- Taxa de crescimento (comparando últimos 3 meses com 3 anteriores)
  WITH recent AS (
    SELECT SUM(valor) as total
    FROM deals
    WHERE status = 'ganho' AND closed_at >= CURRENT_DATE - INTERVAL '3 months'
  ),
  previous AS (
    SELECT SUM(valor) as total
    FROM deals
    WHERE status = 'ganho' 
      AND closed_at >= CURRENT_DATE - INTERVAL '6 months'
      AND closed_at < CURRENT_DATE - INTERVAL '3 months'
  )
  SELECT CASE 
    WHEN p.total > 0 THEN (r.total - p.total) / p.total
    ELSE 0
  END INTO v_growth_rate
  FROM recent r, previous p;
  
  -- Gerar previsões
  FOR i IN 1..p_months_ahead LOOP
    v_month := DATE_TRUNC('month', CURRENT_DATE + (i || ' month')::interval)::date;
    v_forecast := v_avg_monthly * POWER(1 + LEAST(v_growth_rate, 0.5), i);
    
    INSERT INTO sales_forecasts (forecast_month, user_id, forecast_type, predicted_value, confidence_level, assumptions)
    VALUES (v_month, NULL, 'ai', v_forecast, 0.6, jsonb_build_object('method', 'historical', 'growth_rate', v_growth_rate))
    ON CONFLICT (forecast_month, user_id, forecast_type) DO UPDATE
    SET predicted_value = v_forecast, updated_at = now();
    
    v_result := v_result || jsonb_build_object(
      'month', v_month,
      'predicted_value', ROUND(v_forecast, 2),
      'growth_applied', ROUND((POWER(1 + LEAST(v_growth_rate, 0.5), i) - 1) * 100, 1)
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'avg_monthly', ROUND(v_avg_monthly, 2),
    'growth_rate', ROUND(v_growth_rate * 100, 1),
    'forecasts', v_result
  );
END;
$function$
