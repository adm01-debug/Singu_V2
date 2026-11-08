CREATE OR REPLACE FUNCTION public.get_retention_cohort(p_months integer DEFAULT 6)
 RETURNS TABLE(cohort_month text, month_0 numeric, month_1 numeric, month_2 numeric, month_3 numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH cohorts AS (
    SELECT 
      c.id,
      DATE_TRUNC('month', c.created_at)::date as cohort_month
    FROM companies c
    WHERE c.created_at >= NOW() - (p_months || ' months')::interval
      AND c.deleted_at IS NULL
  ),
  retention AS (
    SELECT 
      co.cohort_month,
      EXTRACT(MONTH FROM AGE(i.data_interacao, co.cohort_month))::int as month_number,
      COUNT(DISTINCT co.id) as active_companies
    FROM cohorts co
    LEFT JOIN interactions i ON i.company_id = co.id AND i.data_interacao >= co.cohort_month
    GROUP BY co.cohort_month, EXTRACT(MONTH FROM AGE(i.data_interacao, co.cohort_month))
  )
  SELECT 
    TO_CHAR(r.cohort_month, 'YYYY-MM')::text as cohort_month,
    MAX(CASE WHEN month_number = 0 THEN active_companies ELSE 0 END)::numeric as month_0,
    MAX(CASE WHEN month_number = 1 THEN active_companies ELSE 0 END)::numeric as month_1,
    MAX(CASE WHEN month_number = 2 THEN active_companies ELSE 0 END)::numeric as month_2,
    MAX(CASE WHEN month_number = 3 THEN active_companies ELSE 0 END)::numeric as month_3
  FROM retention r
  GROUP BY r.cohort_month
  ORDER BY r.cohort_month;
END;
$function$
