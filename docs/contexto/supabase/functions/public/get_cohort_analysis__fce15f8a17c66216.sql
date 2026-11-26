CREATE OR REPLACE FUNCTION public.get_cohort_analysis(p_months integer DEFAULT 6)
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
    'cohorts', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.cohort_mes)
      FROM (
        SELECT 
          date_trunc('month', c.created_at)::date as cohort_mes,
          COUNT(DISTINCT c.id) as empresas_criadas,
          COUNT(DISTINCT cu.company_id) FILTER (WHERE cu.cliente_ativado = true) as ativados,
          COUNT(DISTINCT cu.company_id) FILTER (WHERE cu.ja_comprou = true) as convertidos,
          ROUND(COUNT(DISTINCT cu.company_id) FILTER (WHERE cu.ja_comprou = true)::numeric / NULLIF(COUNT(DISTINCT c.id), 0) * 100, 2) as taxa_conversao
        FROM companies c
        LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        AND c.created_at >= now() - (p_months || ' months')::interval
        GROUP BY date_trunc('month', c.created_at)
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
