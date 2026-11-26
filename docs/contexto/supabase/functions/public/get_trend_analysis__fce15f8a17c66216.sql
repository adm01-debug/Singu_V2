CREATE OR REPLACE FUNCTION public.get_trend_analysis(p_months integer DEFAULT 6)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_meses', p_months,
    'tendencia_interacoes', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes)
      FROM (
        SELECT 
          date_trunc('month', created_at)::date as mes,
          COUNT(*) as total,
          LAG(COUNT(*)) OVER (ORDER BY date_trunc('month', created_at)) as mes_anterior,
          ROUND(
            (COUNT(*)::numeric - COALESCE(LAG(COUNT(*)) OVER (ORDER BY date_trunc('month', created_at)), COUNT(*))) /
            NULLIF(LAG(COUNT(*)) OVER (ORDER BY date_trunc('month', created_at)), 0) * 100, 2
          ) as variacao_pct
        FROM interactions
        WHERE created_at >= now() - (p_months || ' months')::interval
        GROUP BY date_trunc('month', created_at)
      ) t
    ),
    'tendencia_empresas', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes)
      FROM (
        SELECT 
          date_trunc('month', created_at)::date as mes,
          COUNT(*) as novas_empresas
        FROM companies
        WHERE created_at >= now() - (p_months || ' months')::interval AND deleted_at IS NULL
        GROUP BY date_trunc('month', created_at)
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
