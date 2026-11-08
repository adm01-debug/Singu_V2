CREATE OR REPLACE FUNCTION public.get_growth_trends(p_months integer DEFAULT 6)
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
          to_char(date_trunc('month', created_at), 'YYYY-MM') as mes,
          COUNT(*) as total,
          LAG(COUNT(*)) OVER (ORDER BY date_trunc('month', created_at)) as mes_anterior,
          ROUND(
            ((COUNT(*)::numeric / NULLIF(LAG(COUNT(*)) OVER (ORDER BY date_trunc('month', created_at)), 0)) - 1) * 100, 2
          ) as growth_pct
        FROM companies
        WHERE created_at >= now() - (p_months || ' months')::interval
        AND deleted_at IS NULL
        GROUP BY date_trunc('month', created_at)
      ) t
    ),
    'interacoes', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes)
      FROM (
        SELECT 
          to_char(date_trunc('month', created_at), 'YYYY-MM') as mes,
          COUNT(*) as total,
          ROUND(
            ((COUNT(*)::numeric / NULLIF(LAG(COUNT(*)) OVER (ORDER BY date_trunc('month', created_at)), 0)) - 1) * 100, 2
          ) as growth_pct
        FROM interactions
        WHERE created_at >= now() - (p_months || ' months')::interval
        GROUP BY date_trunc('month', created_at)
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
