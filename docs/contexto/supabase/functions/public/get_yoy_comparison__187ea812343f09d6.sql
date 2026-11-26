CREATE OR REPLACE FUNCTION public.get_yoy_comparison(p_year integer DEFAULT (EXTRACT(year FROM now()))::integer)
 RETURNS TABLE(month_num integer, current_year numeric, previous_year numeric, change_pct numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT m.month,
    (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND EXTRACT(YEAR FROM closed_at) = p_year AND EXTRACT(MONTH FROM closed_at) = m.month),
    (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status = 'ganho' AND EXTRACT(YEAR FROM closed_at) = p_year - 1 AND EXTRACT(MONTH FROM closed_at) = m.month),
    ROUND(((SELECT COALESCE(SUM(valor), 1) FROM deals WHERE status = 'ganho' AND EXTRACT(YEAR FROM closed_at) = p_year AND EXTRACT(MONTH FROM closed_at) = m.month) /
      NULLIF((SELECT COALESCE(SUM(valor), 1) FROM deals WHERE status = 'ganho' AND EXTRACT(YEAR FROM closed_at) = p_year - 1 AND EXTRACT(MONTH FROM closed_at) = m.month), 0) - 1) * 100, 1)
  FROM generate_series(1, 12) as m(month) ORDER BY 1;
$function$
