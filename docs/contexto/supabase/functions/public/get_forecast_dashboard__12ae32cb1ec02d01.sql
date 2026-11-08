CREATE OR REPLACE FUNCTION public.get_forecast_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_month date := DATE_TRUNC('month', CURRENT_DATE)::date;
BEGIN
  RETURN jsonb_build_object(
    'current_month', v_current_month,
    'current_month_forecast', (
      SELECT predicted_value FROM sales_forecasts 
      WHERE forecast_month = v_current_month AND forecast_type = 'pipeline' AND user_id IS NULL
      LIMIT 1
    ),
    'current_month_actual', (
      SELECT COALESCE(SUM(valor), 0) FROM deals 
      WHERE status = 'ganho' AND DATE_TRUNC('month', closed_at) = v_current_month
    ),
    'quarter_forecast', (
      SELECT COALESCE(SUM(predicted_value), 0) FROM sales_forecasts
      WHERE forecast_month >= v_current_month 
        AND forecast_month < v_current_month + INTERVAL '3 months'
        AND forecast_type = 'pipeline'
        AND user_id IS NULL
    ),
    'pipeline_value', (
      SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido')
    ),
    'weighted_pipeline', (
      SELECT COALESCE(SUM(valor * (probabilidade::numeric / 100)), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido')
    ),
    'forecast_accuracy_last_3m', (
      WITH comparisons AS (
        SELECT 
          sf.forecast_month,
          sf.predicted_value,
          (SELECT SUM(valor) FROM deals WHERE status = 'ganho' AND DATE_TRUNC('month', closed_at) = sf.forecast_month) as actual
        FROM sales_forecasts sf
        WHERE sf.forecast_month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
          AND sf.forecast_month < DATE_TRUNC('month', CURRENT_DATE)
          AND sf.forecast_type = 'pipeline'
          AND sf.user_id IS NULL
      )
      SELECT ROUND(AVG(
        CASE WHEN actual > 0 THEN (1 - ABS(predicted_value - actual) / actual) * 100 ELSE 100 END
      )::numeric, 1)
      FROM comparisons
      WHERE actual IS NOT NULL
    )
  );
END;
$function$
