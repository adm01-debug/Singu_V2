CREATE OR REPLACE FUNCTION public.get_rpc_plan_churn_timeline(_rpc_name text DEFAULT NULL, _hours integer DEFAULT 24)
RETURNS TABLE(bucket timestamptz, plan_changes bigint, samples bigint, p95_ms numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT date_trunc('hour', now()) - make_interval(hours => LEAST(GREATEST(COALESCE(_hours, 24), 1), 168) - 1) AS from_ts,
           date_trunc('hour', now()) AS to_ts
  ),
  buckets AS (
    SELECT generate_series(b.from_ts, b.to_ts, interval '1 hour') AS bucket FROM bounds b
  ),
  changes AS (
    SELECT date_trunc('hour', s.captured_at) AS bucket, count(*)::bigint AS plan_changes
    FROM public.rpc_plan_snapshots s, bounds b
    WHERE s.plan_changed
      AND s.captured_at >= b.from_ts
      AND (_rpc_name IS NULL OR s.rpc_name = _rpc_name)
    GROUP BY 1
  ),
  perf AS (
    SELECT date_trunc('hour', r.created_at) AS bucket,
           count(*)::bigint AS samples,
           percentile_disc(0.95) WITHIN GROUP (ORDER BY r.duration_ms) AS p95_ms
    FROM public.rpc_perf_samples r, bounds b
    WHERE r.created_at >= b.from_ts
      AND (_rpc_name IS NULL OR r.rpc_name = _rpc_name)
    GROUP BY 1
  )
  SELECT k.bucket,
         COALESCE(c.plan_changes, 0),
         COALESCE(p.samples, 0),
         ROUND(COALESCE(p.p95_ms, 0), 1)
  FROM buckets k
  LEFT JOIN changes c ON c.bucket = k.bucket
  LEFT JOIN perf p ON p.bucket = k.bucket
  ORDER BY k.bucket;
$$;

REVOKE ALL ON FUNCTION public.get_rpc_plan_churn_timeline(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rpc_plan_churn_timeline(text, integer) TO authenticated;