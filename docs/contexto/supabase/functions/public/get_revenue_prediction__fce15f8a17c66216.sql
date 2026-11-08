CREATE OR REPLACE FUNCTION public.get_revenue_prediction(p_months integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_avg_monthly numeric;
  v_pipeline_weighted numeric;
  v_predictions jsonb := '[]'::jsonb;
  i int;
BEGIN
  -- Média mensal dos últimos 6 meses
  SELECT COALESCE(AVG(monthly_revenue), 0) INTO v_avg_monthly
  FROM (
    SELECT DATE_TRUNC('month', closed_at) as month, SUM(valor) as monthly_revenue
    FROM deals WHERE status = 'ganho' AND closed_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', closed_at)
  ) m;
  
  -- Pipeline ponderado
  SELECT COALESCE(SUM(valor * probabilidade / 100), 0) INTO v_pipeline_weighted
  FROM deals WHERE status NOT IN ('ganho', 'perdido');
  
  -- Gerar previsões
  FOR i IN 1..p_months LOOP
    v_predictions := v_predictions || jsonb_build_object(
      'month', TO_CHAR(CURRENT_DATE + (i || ' month')::interval, 'YYYY-MM'),
      'predicted', ROUND(v_avg_monthly + (v_pipeline_weighted / p_months * CASE WHEN i = 1 THEN 0.5 WHEN i = 2 THEN 0.3 ELSE 0.2 END), 2),
      'confidence', CASE WHEN i = 1 THEN 'alta' WHEN i = 2 THEN 'média' ELSE 'baixa' END
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'avg_monthly_revenue', ROUND(v_avg_monthly, 2),
    'pipeline_weighted', ROUND(v_pipeline_weighted, 2),
    'predictions', v_predictions,
    'generated_at', NOW()
  );
END;
$function$
