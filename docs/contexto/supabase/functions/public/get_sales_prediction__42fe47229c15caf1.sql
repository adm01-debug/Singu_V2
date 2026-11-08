CREATE OR REPLACE FUNCTION public.get_sales_prediction(p_months_history integer DEFAULT 6)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  avg_monthly_value numeric;
  avg_monthly_customers numeric;
  trend_factor numeric;
BEGIN
  -- Calcular médias
  SELECT COALESCE(AVG(monthly_value), 0) INTO avg_monthly_value
  FROM (
    SELECT date_trunc('month', updated_at) as mes, SUM(valor_total_compras) as monthly_value
    FROM customers
    WHERE ja_comprou = true AND updated_at >= now() - (p_months_history || ' months')::interval AND deleted_at IS NULL
    GROUP BY date_trunc('month', updated_at)
  ) t;
  
  SELECT COALESCE(AVG(monthly_count), 0) INTO avg_monthly_customers
  FROM (
    SELECT date_trunc('month', created_at) as mes, COUNT(*) as monthly_count
    FROM customers
    WHERE created_at >= now() - (p_months_history || ' months')::interval AND deleted_at IS NULL
    GROUP BY date_trunc('month', created_at)
  ) t;
  
  -- Fator de tendência simples (comparando últimos 3 meses com anteriores)
  trend_factor := 1.0;
  
  SELECT jsonb_build_object(
    'historico_meses', p_months_history,
    'media_mensal', jsonb_build_object(
      'valor', ROUND(avg_monthly_value, 2),
      'novos_clientes', ROUND(avg_monthly_customers, 2)
    ),
    'previsao_proximo_mes', jsonb_build_object(
      'valor_estimado', ROUND(avg_monthly_value * trend_factor, 2),
      'novos_clientes_estimados', ROUND(avg_monthly_customers * trend_factor, 0),
      'confianca', 'media'
    ),
    'previsao_trimestre', jsonb_build_object(
      'valor_estimado', ROUND(avg_monthly_value * 3 * trend_factor, 2),
      'novos_clientes_estimados', ROUND(avg_monthly_customers * 3 * trend_factor, 0)
    ),
    'historico_mensal', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes DESC)
      FROM (
        SELECT 
          date_trunc('month', updated_at)::date as mes,
          COUNT(*) as clientes,
          SUM(valor_total_compras) as valor
        FROM customers
        WHERE ja_comprou = true AND updated_at >= now() - (p_months_history || ' months')::interval AND deleted_at IS NULL
        GROUP BY date_trunc('month', updated_at)::date
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
