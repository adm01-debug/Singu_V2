CREATE OR REPLACE FUNCTION public.get_cohort_analysis(p_period text DEFAULT 'month'::text)
 RETURNS TABLE(cohort text, total_companies bigint, still_active bigint, retention_rate numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH cohorts AS (
    SELECT DATE_TRUNC(p_period, c.created_at)::date as cohort_date, c.id
    FROM companies c WHERE c.deleted_at IS NULL AND c.created_at >= NOW() - interval '12 months'
  )
  SELECT TO_CHAR(cohort_date, 'YYYY-MM'), COUNT(DISTINCT id),
    COUNT(DISTINCT id) FILTER (WHERE EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cohorts.id AND i.data_interacao >= NOW() - interval '30 days')),
    ROUND(COUNT(DISTINCT id) FILTER (WHERE EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cohorts.id AND i.data_interacao >= NOW() - interval '30 days'))::numeric / NULLIF(COUNT(DISTINCT id), 0) * 100, 1)
  FROM cohorts GROUP BY cohort_date ORDER BY cohort_date;
$function$
