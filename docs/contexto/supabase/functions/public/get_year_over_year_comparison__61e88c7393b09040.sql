CREATE OR REPLACE FUNCTION public.get_year_over_year_comparison(p_current_year integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer)
 RETURNS TABLE(month_num integer, month_name text, current_year_revenue numeric, previous_year_revenue numeric, growth_percent numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    m.month::int as month_num,
    TO_CHAR(make_date(2024, m.month, 1), 'Mon')::text as month_name,
    COALESCE((SELECT SUM(valor) FROM deals WHERE status = 'ganho' AND EXTRACT(YEAR FROM closed_at) = p_current_year AND EXTRACT(MONTH FROM closed_at) = m.month), 0)::numeric as current_year_revenue,
    COALESCE((SELECT SUM(valor) FROM deals WHERE status = 'ganho' AND EXTRACT(YEAR FROM closed_at) = p_current_year - 1 AND EXTRACT(MONTH FROM closed_at) = m.month), 0)::numeric as previous_year_revenue,
    CASE 
      WHEN (SELECT SUM(valor) FROM deals WHERE status = 'ganho' AND EXTRACT(YEAR FROM closed_at) = p_current_year - 1 AND EXTRACT(MONTH FROM closed_at) = m.month) > 0
      THEN ROUND(100.0 * (
        COALESCE((SELECT SUM(valor) FROM deals WHERE status = 'ganho' AND EXTRACT(YEAR FROM closed_at) = p_current_year AND EXTRACT(MONTH FROM closed_at) = m.month), 0) - 
        COALESCE((SELECT SUM(valor) FROM deals WHERE status = 'ganho' AND EXTRACT(YEAR FROM closed_at) = p_current_year - 1 AND EXTRACT(MONTH FROM closed_at) = m.month), 0)
      ) / (SELECT SUM(valor) FROM deals WHERE status = 'ganho' AND EXTRACT(YEAR FROM closed_at) = p_current_year - 1 AND EXTRACT(MONTH FROM closed_at) = m.month), 1)
      ELSE 0
    END::numeric as growth_percent
  FROM generate_series(1, 12) as m(month)
  ORDER BY m.month;
END;
$function$
