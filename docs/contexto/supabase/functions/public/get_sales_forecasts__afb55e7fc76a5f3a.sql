CREATE OR REPLACE FUNCTION public.get_sales_forecasts(p_user_id uuid DEFAULT NULL::uuid, p_months integer DEFAULT 6)
 RETURNS TABLE(forecast_month date, pipeline_forecast numeric, ai_forecast numeric, actual_value numeric, accuracy numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      DATE_TRUNC('month', CURRENT_DATE - (3 || ' month')::interval),
      DATE_TRUNC('month', CURRENT_DATE + (p_months || ' month')::interval),
      '1 month'
    )::date as month
  ),
  actuals AS (
    SELECT DATE_TRUNC('month', closed_at)::date as month, SUM(valor) as total
    FROM deals
    WHERE status = 'ganho'
      AND (p_user_id IS NULL OR user_id = p_user_id)
    GROUP BY DATE_TRUNC('month', closed_at)
  )
  SELECT 
    m.month,
    (SELECT predicted_value FROM sales_forecasts WHERE forecast_month = m.month AND forecast_type = 'pipeline' AND (user_id = p_user_id OR (p_user_id IS NULL AND user_id IS NULL)) LIMIT 1),
    (SELECT predicted_value FROM sales_forecasts WHERE forecast_month = m.month AND forecast_type = 'ai' AND user_id IS NULL LIMIT 1),
    a.total,
    CASE 
      WHEN a.total IS NOT NULL AND (SELECT predicted_value FROM sales_forecasts WHERE forecast_month = m.month AND forecast_type = 'pipeline' LIMIT 1) IS NOT NULL
      THEN ROUND((1 - ABS(a.total - (SELECT predicted_value FROM sales_forecasts WHERE forecast_month = m.month AND forecast_type = 'pipeline' LIMIT 1)) / NULLIF(a.total, 0)) * 100, 1)
      ELSE NULL
    END
  FROM months m
  LEFT JOIN actuals a ON a.month = m.month
  ORDER BY m.month;
END;
$function$
