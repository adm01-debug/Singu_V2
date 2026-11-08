CREATE OR REPLACE FUNCTION public.get_slow_rpc_trend(_hours_recent integer DEFAULT 1, _hours_baseline integer DEFAULT 24, _limit integer DEFAULT 5)
 RETURNS TABLE(rpc_name text, samples_recent integer, samples_baseline integer, p95_recent_ms numeric, p95_baseline_ms numeric, ratio numeric, is_degraded boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user NOT IN ('postgres', 'service_role')
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH recent AS (
    SELECT s.rpc_name, COUNT(*)::int AS samples,
           ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms))::numeric, 2) AS p95
      FROM public.rpc_perf_samples s
     WHERE s.created_at >= now() - make_interval(hours => _hours_recent)
     GROUP BY s.rpc_name
  ),
  baseline AS (
    SELECT s.rpc_name, COUNT(*)::int AS samples,
           ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms))::numeric, 2) AS p95
      FROM public.rpc_perf_samples s
     WHERE s.created_at >= now() - make_interval(hours => _hours_baseline)
       AND s.created_at <  now() - make_interval(hours => _hours_recent)
     GROUP BY s.rpc_name
  )
  SELECT COALESCE(r.rpc_name, b.rpc_name),
         COALESCE(r.samples, 0),
         COALESCE(b.samples, 0),
         COALESCE(r.p95, 0),
         COALESCE(b.p95, 0),
         CASE WHEN COALESCE(b.p95, 0) > 0 THEN ROUND(COALESCE(r.p95, 0) / b.p95, 2) END,
         (COALESCE(r.samples, 0) >= 3 AND COALESCE(b.samples, 0) >= 3 AND COALESCE(b.p95, 0) > 0 AND COALESCE(r.p95, 0) / b.p95 >= 1.5)
    FROM recent r
    FULL OUTER JOIN baseline b USING (rpc_name)
   ORDER BY 7 DESC, 4 DESC NULLS LAST
   LIMIT _limit;
END;
$function$
