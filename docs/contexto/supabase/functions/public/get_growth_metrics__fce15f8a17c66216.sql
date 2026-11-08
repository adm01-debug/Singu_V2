CREATE OR REPLACE FUNCTION public.get_growth_metrics(p_months integer DEFAULT 12)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'periodo_meses', p_months,
    'companies_growth', (
      SELECT jsonb_agg(jsonb_build_object(
        'month', TO_CHAR(m, 'YYYY-MM'),
        'new_companies', new_cnt,
        'cumulative', SUM(new_cnt) OVER (ORDER BY m)
      ))
      FROM (
        SELECT DATE_TRUNC('month', created_at) as m, COUNT(*) as new_cnt
        FROM companies WHERE created_at >= NOW() - (p_months || ' months')::INTERVAL AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY m
      ) sub
    ),
    'contacts_growth', (
      SELECT jsonb_agg(jsonb_build_object(
        'month', TO_CHAR(m, 'YYYY-MM'),
        'new_contacts', new_cnt
      ))
      FROM (
        SELECT DATE_TRUNC('month', created_at) as m, COUNT(*) as new_cnt
        FROM contacts WHERE created_at >= NOW() - (p_months || ' months')::INTERVAL AND deleted_at IS NULL
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY m
      ) sub
    ),
    'interactions_growth', (
      SELECT jsonb_agg(jsonb_build_object(
        'month', TO_CHAR(m, 'YYYY-MM'),
        'total', cnt,
        'mom_change_pct', ROUND(100.0 * (cnt - LAG(cnt) OVER (ORDER BY m)) / NULLIF(LAG(cnt) OVER (ORDER BY m), 0), 1)
      ))
      FROM (
        SELECT DATE_TRUNC('month', created_at) as m, COUNT(*) as cnt
        FROM interactions WHERE created_at >= NOW() - (p_months || ' months')::INTERVAL
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY m
      ) sub
    ),
    'summary', jsonb_build_object(
      'total_companies_now', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL AND status = 'ativo'),
      'total_contacts_now', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'avg_monthly_interactions', (
        SELECT ROUND(AVG(cnt), 0)
        FROM (
          SELECT COUNT(*) as cnt FROM interactions 
          WHERE created_at >= NOW() - (p_months || ' months')::INTERVAL
          GROUP BY DATE_TRUNC('month', created_at)
        ) sub
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
