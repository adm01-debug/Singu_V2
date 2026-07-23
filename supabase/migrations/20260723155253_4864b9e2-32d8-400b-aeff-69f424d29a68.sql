
CREATE OR REPLACE FUNCTION public.get_slow_rpc_trend(_hours_recent integer DEFAULT 1, _hours_baseline integer DEFAULT 24, _limit integer DEFAULT 5)
RETURNS TABLE(
  rpc_name text,
  samples_recent integer,
  samples_baseline integer,
  p95_recent_ms numeric,
  p95_baseline_ms numeric,
  ratio numeric,
  is_degraded boolean
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH recent AS (
    SELECT s.rpc_name,
           COUNT(*)::int AS samples,
           ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms))::numeric, 2) AS p95
    FROM public.rpc_perf_samples s
    WHERE s.observed_at >= now() - make_interval(hours => _hours_recent)
    GROUP BY s.rpc_name
  ),
  baseline AS (
    SELECT s.rpc_name,
           COUNT(*)::int AS samples,
           ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY s.duration_ms))::numeric, 2) AS p95
    FROM public.rpc_perf_samples s
    WHERE s.observed_at >= now() - make_interval(hours => _hours_baseline)
    GROUP BY s.rpc_name
  )
  SELECT
    COALESCE(r.rpc_name, b.rpc_name) AS rpc_name,
    COALESCE(r.samples, 0) AS samples_recent,
    COALESCE(b.samples, 0) AS samples_baseline,
    COALESCE(r.p95, 0) AS p95_recent_ms,
    COALESCE(b.p95, 0) AS p95_baseline_ms,
    CASE WHEN COALESCE(b.p95, 0) > 0 THEN ROUND((COALESCE(r.p95, 0) / b.p95)::numeric, 2) ELSE NULL END AS ratio,
    (COALESCE(r.samples, 0) >= 3 AND COALESCE(b.p95, 0) > 0 AND (COALESCE(r.p95, 0) / b.p95) >= 1.5) AS is_degraded
  FROM recent r
  FULL OUTER JOIN baseline b USING (rpc_name)
  ORDER BY is_degraded DESC, p95_recent_ms DESC NULLS LAST
  LIMIT _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_slow_rpc_trend(integer, integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_slow_rpc_trend(integer, integer, integer) TO authenticated, service_role;
