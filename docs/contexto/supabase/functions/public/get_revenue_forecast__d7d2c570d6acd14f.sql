CREATE OR REPLACE FUNCTION public.get_revenue_forecast(p_months_ahead integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  media_mensal numeric;
BEGIN
  SELECT ROUND(AVG(val), 2) INTO media_mensal
  FROM (
    SELECT COALESCE(SUM(valor_total_compras), 0) as val
    FROM customers
    WHERE ja_comprou = true AND updated_at >= now() - interval '6 months' AND deleted_at IS NULL
    GROUP BY date_trunc('month', updated_at)
  ) t;
  
  SELECT jsonb_build_object(
    'meses_projetados', p_months_ahead,
    'media_mensal_historica', media_mensal,
    'projecao', (
      SELECT jsonb_agg(jsonb_build_object(
        'mes', date_trunc('month', now() + ((n || ' months')::interval)),
        'valor_projetado', media_mensal
      ))
      FROM generate_series(1, p_months_ahead) as n
    ),
    'total_projetado', media_mensal * p_months_ahead,
    'metodologia', 'Media móvel 6 meses'
  ) INTO result;
  
  RETURN result;
END;
$function$
