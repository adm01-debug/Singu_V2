CREATE OR REPLACE FUNCTION public.get_growth_trend(p_months integer DEFAULT 6)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_meses', p_months,
    'tendencia', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes)
      FROM (
        SELECT 
          date_trunc('month', created_at)::date as mes,
          COUNT(*) as empresas,
          (SELECT COUNT(*) FROM interactions WHERE date_trunc('month', created_at) = date_trunc('month', c.created_at)) as interacoes,
          (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE date_trunc('month', updated_at) = date_trunc('month', c.created_at) AND ja_comprou = true AND deleted_at IS NULL) as valor
        FROM companies c
        WHERE c.created_at >= now() - (p_months || ' months')::interval AND c.deleted_at IS NULL
        GROUP BY date_trunc('month', created_at)
      ) t
    ),
    'media_mensal_empresas', (
      SELECT ROUND(AVG(cnt), 2) FROM (
        SELECT COUNT(*) as cnt FROM companies
        WHERE created_at >= now() - (p_months || ' months')::interval AND deleted_at IS NULL
        GROUP BY date_trunc('month', created_at)
      ) t
    ),
    'media_mensal_valor', (
      SELECT ROUND(AVG(val), 2) FROM (
        SELECT COALESCE(SUM(valor_total_compras), 0) as val FROM customers
        WHERE ja_comprou = true AND updated_at >= now() - (p_months || ' months')::interval AND deleted_at IS NULL
        GROUP BY date_trunc('month', updated_at)
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
