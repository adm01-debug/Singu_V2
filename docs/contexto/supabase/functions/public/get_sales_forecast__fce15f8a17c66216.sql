CREATE OR REPLACE FUNCTION public.get_sales_forecast(p_months integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'forecast_months', p_months,
    'pipeline_total', (
      SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado')
    ),
    'weighted_forecast', (
      SELECT COALESCE(SUM(valor * probabilidade / 100), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado')
    ),
    'by_month', (
      SELECT jsonb_agg(jsonb_build_object(
        'month', month_year,
        'expected', total_value,
        'weighted', weighted_value,
        'deals_count', deals_count
      ))
      FROM (
        SELECT 
          TO_CHAR(previsao_fechamento, 'YYYY-MM') as month_year,
          SUM(valor) as total_value,
          SUM(valor * probabilidade / 100) as weighted_value,
          COUNT(*) as deals_count
        FROM deals
        WHERE status NOT IN ('ganho', 'perdido', 'arquivado')
          AND previsao_fechamento BETWEEN CURRENT_DATE AND CURRENT_DATE + (p_months || ' months')::interval
        GROUP BY TO_CHAR(previsao_fechamento, 'YYYY-MM')
        ORDER BY month_year
      ) t
    ),
    'by_stage', (
      SELECT jsonb_agg(jsonb_build_object(
        'stage', pipeline_stage,
        'count', cnt,
        'value', total_value,
        'avg_probability', avg_prob
      ))
      FROM (
        SELECT pipeline_stage, COUNT(*) as cnt, SUM(valor) as total_value, AVG(probabilidade) as avg_prob
        FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado')
        GROUP BY pipeline_stage
      ) t
    ),
    'best_case', (
      SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado') AND probabilidade >= 70
    ),
    'worst_case', (
      SELECT COALESCE(SUM(valor * probabilidade / 100), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido', 'arquivado') AND probabilidade <= 30
    ),
    'calculated_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
