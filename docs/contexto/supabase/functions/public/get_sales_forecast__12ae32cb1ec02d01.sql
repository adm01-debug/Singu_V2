CREATE OR REPLACE FUNCTION public.get_sales_forecast()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  avg_monthly_revenue numeric;
  avg_monthly_customers numeric;
  trend_factor numeric;
BEGIN
  -- Calcular médias dos últimos 3 meses
  SELECT 
    COALESCE(AVG(monthly_revenue), 0),
    COALESCE(AVG(monthly_customers), 0)
  INTO avg_monthly_revenue, avg_monthly_customers
  FROM (
    SELECT 
      SUM(valor_total_compras) as monthly_revenue,
      COUNT(*) as monthly_customers
    FROM customers
    WHERE ja_comprou = true 
    AND updated_at >= now() - interval '3 months'
    AND deleted_at IS NULL
    GROUP BY date_trunc('month', updated_at)
  ) t;
  
  -- Calcular fator de tendência baseado em crescimento de empresas
  SELECT COALESCE(
    (SELECT COUNT(*) FROM companies WHERE created_at >= now() - interval '1 month' AND deleted_at IS NULL)::numeric /
    NULLIF((SELECT COUNT(*) FROM companies WHERE created_at >= now() - interval '2 months' AND created_at < now() - interval '1 month' AND deleted_at IS NULL), 0),
    1
  ) INTO trend_factor;
  
  SELECT jsonb_build_object(
    'timestamp', now(),
    'base_dados', jsonb_build_object(
      'receita_media_mensal', ROUND(avg_monthly_revenue, 2),
      'clientes_media_mensal', ROUND(avg_monthly_customers, 2),
      'fator_tendencia', ROUND(trend_factor, 2)
    ),
    'previsao_proximo_mes', jsonb_build_object(
      'receita_estimada', ROUND(avg_monthly_revenue * trend_factor, 2),
      'novos_clientes_estimados', ROUND(avg_monthly_customers * trend_factor, 0),
      'confianca', CASE 
        WHEN avg_monthly_revenue > 0 AND avg_monthly_customers > 5 THEN 'alta'
        WHEN avg_monthly_revenue > 0 THEN 'media'
        ELSE 'baixa'
      END
    ),
    'pipeline_atual', jsonb_build_object(
      'total_clientes', (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL),
      'clientes_ativos', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
      'taxa_conversao', (
        SELECT ROUND((COUNT(*) FILTER (WHERE ja_comprou = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 2)
        FROM customers WHERE deleted_at IS NULL
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
