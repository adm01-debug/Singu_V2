CREATE OR REPLACE FUNCTION public.get_trends_analysis(p_months integer DEFAULT 6)
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
    'empresas', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes)
      FROM (
        SELECT 
          date_trunc('month', created_at)::date as mes,
          COUNT(*) as novas,
          SUM(COUNT(*)) OVER (ORDER BY date_trunc('month', created_at)) as acumulado
        FROM companies
        WHERE created_at >= now() - (p_months || ' months')::interval AND deleted_at IS NULL
        GROUP BY date_trunc('month', created_at)
      ) t
    ),
    'interacoes', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes)
      FROM (
        SELECT 
          date_trunc('month', created_at)::date as mes,
          COUNT(*) as total
        FROM interactions
        WHERE created_at >= now() - (p_months || ' months')::interval
        GROUP BY date_trunc('month', created_at)
      ) t
    ),
    'vendas', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes)
      FROM (
        SELECT 
          date_trunc('month', updated_at)::date as mes,
          COUNT(*) as clientes,
          COALESCE(SUM(valor_total_compras), 0) as valor
        FROM customers
        WHERE ja_comprou = true AND updated_at >= now() - (p_months || ' months')::interval AND deleted_at IS NULL
        GROUP BY date_trunc('month', updated_at)
      ) t
    ),
    'crescimento', jsonb_build_object(
      'empresas_mes_atual', (SELECT COUNT(*) FROM companies WHERE date_trunc('month', created_at) = date_trunc('month', now()) AND deleted_at IS NULL),
      'empresas_mes_anterior', (SELECT COUNT(*) FROM companies WHERE date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month') AND deleted_at IS NULL),
      'variacao_percentual', ROUND(
        ((SELECT COUNT(*) FROM companies WHERE date_trunc('month', created_at) = date_trunc('month', now()) AND deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM companies WHERE date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month') AND deleted_at IS NULL), 0) - 1) * 100, 2
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
