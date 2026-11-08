CREATE OR REPLACE FUNCTION public.get_annual_summary(p_year integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'year', p_year,
    'companies', jsonb_build_object(
      'start_year', (SELECT COUNT(*) FROM companies WHERE created_at < MAKE_DATE(p_year, 1, 1) AND deleted_at IS NULL),
      'end_year', (SELECT COUNT(*) FROM companies WHERE created_at < MAKE_DATE(p_year + 1, 1, 1) AND deleted_at IS NULL),
      'new', (SELECT COUNT(*) FROM companies WHERE EXTRACT(YEAR FROM created_at) = p_year AND deleted_at IS NULL),
      'growth_pct', NULL -- Calculado abaixo
    ),
    'quarterly_breakdown', (
      SELECT jsonb_agg(get_quarterly_report(q, p_year) ORDER BY q)
      FROM generate_series(1, 4) as q
      WHERE MAKE_DATE(p_year, (q - 1) * 3 + 1, 1) <= CURRENT_DATE
    ),
    'interactions', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM interactions WHERE EXTRACT(YEAR FROM created_at) = p_year),
      'monthly_avg', (
        SELECT ROUND(AVG(cnt), 0)
        FROM (
          SELECT COUNT(*) as cnt
          FROM interactions WHERE EXTRACT(YEAR FROM created_at) = p_year
          GROUP BY DATE_TRUNC('month', created_at)
        ) sub
      )
    ),
    'top_companies', (
      SELECT jsonb_agg(jsonb_build_object('id', cid, 'name', cname, 'interactions', cnt))
      FROM (
        SELECT i.company_id as cid, c.nome_fantasia as cname, COUNT(*) as cnt
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        WHERE EXTRACT(YEAR FROM i.created_at) = p_year
        GROUP BY i.company_id, c.nome_fantasia
        ORDER BY cnt DESC
        LIMIT 10
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
