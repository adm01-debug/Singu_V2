CREATE OR REPLACE FUNCTION public.generate_monthly_report(p_year integer, p_month integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_start date; v_end date; v_result jsonb;
BEGIN
  v_start := make_date(p_year, p_month, 1); v_end := (v_start + interval '1 month')::date;
  SELECT jsonb_build_object(
    'period', TO_CHAR(v_start, 'YYYY-MM'),
    'revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND closed_at >= v_start AND closed_at < v_end),
    'deals_won', (SELECT COUNT(*) FROM deals WHERE status = 'ganho' AND closed_at >= v_start AND closed_at < v_end),
    'interactions', (SELECT COUNT(*) FROM interactions WHERE data_interacao >= v_start AND data_interacao < v_end)
  ) INTO v_result;
  RETURN v_result;
END;
$function$
