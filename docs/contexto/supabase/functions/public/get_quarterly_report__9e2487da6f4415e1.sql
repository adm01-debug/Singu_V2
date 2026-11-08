CREATE OR REPLACE FUNCTION public.get_quarterly_report(p_quarter integer, p_year integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_result JSONB;
BEGIN
  v_start_date := MAKE_DATE(p_year, (p_quarter - 1) * 3 + 1, 1);
  v_end_date := (v_start_date + INTERVAL '3 months' - INTERVAL '1 day')::DATE;
  
  SELECT jsonb_build_object(
    'quarter', p_quarter,
    'year', p_year,
    'start_date', v_start_date,
    'end_date', v_end_date,
    'companies', jsonb_build_object(
      'total_active', (SELECT COUNT(*) FROM companies WHERE status = 'ativo' AND deleted_at IS NULL),
      'new_this_quarter', (SELECT COUNT(*) FROM companies WHERE created_at::DATE BETWEEN v_start_date AND v_end_date AND deleted_at IS NULL),
      'churned', (SELECT COUNT(*) FROM companies WHERE status = 'inativo' AND updated_at::DATE BETWEEN v_start_date AND v_end_date)
    ),
    'interactions', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM interactions WHERE created_at::DATE BETWEEN v_start_date AND v_end_date),
      'by_channel', (
        SELECT jsonb_object_agg(channel, cnt)
        FROM (SELECT channel, COUNT(*) as cnt FROM interactions WHERE created_at::DATE BETWEEN v_start_date AND v_end_date GROUP BY channel) sub
      ),
      'by_month', (
        SELECT jsonb_agg(jsonb_build_object('month', TO_CHAR(m, 'YYYY-MM'), 'count', cnt))
        FROM (
          SELECT DATE_TRUNC('month', created_at) as m, COUNT(*) as cnt
          FROM interactions WHERE created_at::DATE BETWEEN v_start_date AND v_end_date
          GROUP BY DATE_TRUNC('month', created_at)
          ORDER BY m
        ) sub
      )
    ),
    'contacts', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'new_this_quarter', (SELECT COUNT(*) FROM contacts WHERE created_at::DATE BETWEEN v_start_date AND v_end_date AND deleted_at IS NULL)
    ),
    'performance', jsonb_build_object(
      'avg_response_time_min', (
        SELECT ROUND(AVG(response_time)::NUMERIC / 60, 2)
        FROM interactions WHERE response_time IS NOT NULL AND created_at::DATE BETWEEN v_start_date AND v_end_date
      ),
      'positive_sentiment_pct', (
        SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE sentiment = 'positivo') / NULLIF(COUNT(*), 0), 1)
        FROM interactions WHERE created_at::DATE BETWEEN v_start_date AND v_end_date
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
