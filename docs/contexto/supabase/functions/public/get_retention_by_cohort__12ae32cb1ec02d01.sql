CREATE OR REPLACE FUNCTION public.get_retention_by_cohort()
 RETURNS TABLE(cohort_month text, m0 bigint, m1 bigint, m2 bigint, m3 bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH cohorts AS (
    SELECT DATE_TRUNC('month', c.created_at)::date as cohort, c.id FROM companies c WHERE c.deleted_at IS NULL AND c.created_at >= NOW() - interval '6 months'
  )
  SELECT TO_CHAR(cohort, 'YYYY-MM'),
    COUNT(DISTINCT id),
    COUNT(DISTINCT id) FILTER (WHERE EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cohorts.id AND i.data_interacao BETWEEN cohort + interval '1 month' AND cohort + interval '2 months')),
    COUNT(DISTINCT id) FILTER (WHERE EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cohorts.id AND i.data_interacao BETWEEN cohort + interval '2 months' AND cohort + interval '3 months')),
    COUNT(DISTINCT id) FILTER (WHERE EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cohorts.id AND i.data_interacao BETWEEN cohort + interval '3 months' AND cohort + interval '4 months'))
  FROM cohorts GROUP BY cohort ORDER BY cohort;
$function$
