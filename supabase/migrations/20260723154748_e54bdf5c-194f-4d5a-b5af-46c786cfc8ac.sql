
-- 1) Perf samples table
CREATE TABLE IF NOT EXISTS public.rpc_perf_samples (
  id BIGSERIAL PRIMARY KEY,
  rpc_name TEXT NOT NULL,
  duration_ms NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rpc_perf_samples_name_time_idx
  ON public.rpc_perf_samples (rpc_name, created_at DESC);

GRANT SELECT ON public.rpc_perf_samples TO authenticated;
GRANT ALL ON public.rpc_perf_samples TO service_role;

ALTER TABLE public.rpc_perf_samples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read perf samples" ON public.rpc_perf_samples;
CREATE POLICY "Admins read perf samples"
  ON public.rpc_perf_samples
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Recorder helper (SECURITY DEFINER so any RPC can insert w/o granting to authenticated)
CREATE OR REPLACE FUNCTION public.record_rpc_perf_sample(_rpc_name TEXT, _duration_ms NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.rpc_perf_samples (rpc_name, duration_ms)
  VALUES (_rpc_name, _duration_ms);
EXCEPTION WHEN OTHERS THEN
  -- never break the calling RPC due to instrumentation
  NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.record_rpc_perf_sample(TEXT, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_rpc_perf_sample(TEXT, NUMERIC) TO authenticated, service_role;

-- 3) Stats reader
CREATE OR REPLACE FUNCTION public.get_rpc_perf_stats(_hours INTEGER DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _since TIMESTAMPTZ := now() - make_interval(hours => _hours);
  _result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access_denied' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_agg(row_to_json(s) ORDER BY s.samples DESC)
  INTO _result
  FROM (
    SELECT
      rpc_name,
      COUNT(*)::int AS samples,
      ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms)::numeric, 1) AS p50_ms,
      ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 1) AS p95_ms,
      ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms)::numeric, 1) AS p99_ms,
      ROUND(MAX(duration_ms)::numeric, 1) AS max_ms,
      ROUND(AVG(duration_ms)::numeric, 1) AS avg_ms,
      MAX(created_at) AS last_seen
    FROM public.rpc_perf_samples
    WHERE created_at >= _since
    GROUP BY rpc_name
  ) s;

  RETURN jsonb_build_object(
    'window_hours', _hours,
    'stats', COALESCE(_result, '[]'::jsonb),
    'generated_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_rpc_perf_stats(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rpc_perf_stats(INTEGER) TO authenticated;

-- 4) Instrument get_ai_gateway_health with self-timing (wrapper preserving signature)
CREATE OR REPLACE FUNCTION public.get_ai_gateway_health(_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  _since timestamptz := now() - make_interval(hours => _hours);
  _result jsonb;
  _t0 timestamptz := clock_timestamp();
  _dur_ms numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access_denied' USING ERRCODE = '42501';
  END IF;

  WITH base AS (
    SELECT * FROM public.ai_gateway_metrics WHERE created_at >= _since
  ),
  totals AS (
    SELECT
      COUNT(*)::int AS requests,
      COUNT(*) FILTER (WHERE status_code >= 400 OR error IS NOT NULL)::int AS errors,
      ROUND((COUNT(*) FILTER (WHERE status_code >= 400 OR error IS NOT NULL)::numeric
             / NULLIF(COUNT(*), 0)::numeric) * 100, 2) AS error_rate_pct,
      ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS p50_ms,
      ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS p95_ms,
      ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS p99_ms,
      COALESCE(SUM(tokens_in), 0)::bigint AS tokens_in,
      COALESCE(SUM(tokens_out), 0)::bigint AS tokens_out
    FROM base
  ),
  by_function AS (
    SELECT jsonb_agg(row_to_json(f) ORDER BY f.requests DESC) AS data
    FROM (
      SELECT function_name, COUNT(*)::int AS requests,
        COUNT(*) FILTER (WHERE status_code >= 400 OR error IS NOT NULL)::int AS errors,
        ROUND((COUNT(*) FILTER (WHERE status_code >= 400 OR error IS NOT NULL)::numeric
               / NULLIF(COUNT(*), 0)::numeric) * 100, 2) AS error_rate_pct,
        ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS p50_ms,
        ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS p95_ms,
        MAX(created_at) AS last_seen
      FROM base GROUP BY function_name
    ) f
  ),
  by_model AS (
    SELECT jsonb_agg(row_to_json(m) ORDER BY m.requests DESC) AS data
    FROM (
      SELECT COALESCE(model, 'unknown') AS model, COUNT(*)::int AS requests,
        COUNT(*) FILTER (WHERE status_code >= 400 OR error IS NOT NULL)::int AS errors,
        ROUND((COUNT(*) FILTER (WHERE status_code >= 400 OR error IS NOT NULL)::numeric
               / NULLIF(COUNT(*), 0)::numeric) * 100, 2) AS error_rate_pct,
        ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS p50_ms,
        ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS p95_ms,
        COALESCE(SUM(tokens_in), 0)::bigint AS tokens_in,
        COALESCE(SUM(tokens_out), 0)::bigint AS tokens_out
      FROM base GROUP BY COALESCE(model, 'unknown')
    ) m
  ),
  active_alerts AS (
    SELECT jsonb_agg(row_to_json(a) ORDER BY a.created_at DESC) AS data
    FROM (
      SELECT id, alert_type, severity, message, metadata, created_at
      FROM public.system_alerts
      WHERE alert_type LIKE 'ai_gateway_%'
        AND acknowledged_at IS NULL
        AND created_at >= now() - interval '2 hours'
      ORDER BY created_at DESC LIMIT 20
    ) a
  ),
  resolved_recent AS (
    SELECT jsonb_agg(row_to_json(r) ORDER BY r.acknowledged_at DESC) AS data
    FROM (
      SELECT id, alert_type, severity, message, created_at, acknowledged_at,
        ROUND(EXTRACT(EPOCH FROM (acknowledged_at - created_at))::numeric / 60.0, 1) AS mttr_minutes,
        (metadata->>'auto_resolved')::boolean AS auto_resolved
      FROM public.system_alerts
      WHERE alert_type LIKE 'ai_gateway_%'
        AND acknowledged_at IS NOT NULL
        AND acknowledged_at >= now() - interval '24 hours'
      ORDER BY acknowledged_at DESC LIMIT 10
    ) r
  ),
  resolved_mttr AS (
    SELECT jsonb_agg(row_to_json(mt) ORDER BY mt.alert_type) AS data
    FROM (
      SELECT alert_type, COUNT(*)::int AS resolved_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)))::numeric / 60.0, 1) AS avg_mttr_minutes,
        ROUND(MAX(EXTRACT(EPOCH FROM (acknowledged_at - created_at)))::numeric / 60.0, 1) AS max_mttr_minutes
      FROM public.system_alerts
      WHERE alert_type LIKE 'ai_gateway_%'
        AND acknowledged_at IS NOT NULL
        AND acknowledged_at >= now() - interval '24 hours'
      GROUP BY alert_type
    ) mt
  ),
  heatmap_raw AS (
    SELECT
      EXTRACT(DOW FROM created_at)::int AS dow,
      EXTRACT(HOUR FROM created_at)::int AS hour,
      COUNT(*)::int AS requests,
      COUNT(*) FILTER (WHERE status_code >= 400 OR error IS NOT NULL)::int AS errors
    FROM base
    GROUP BY 1, 2
  ),
  heatmap AS (
    SELECT jsonb_agg(row_to_json(h) ORDER BY h.dow, h.hour) AS data
    FROM (
      SELECT dow, hour, requests, errors,
        ROUND((errors::numeric / NULLIF(requests, 0)::numeric) * 100, 2) AS error_rate_pct
      FROM heatmap_raw
    ) h
  ),
  worst_windows AS (
    SELECT jsonb_agg(row_to_json(w) ORDER BY w.error_rate_pct DESC) AS data
    FROM (
      SELECT dow, hour, requests, errors,
        ROUND((errors::numeric / NULLIF(requests, 0)::numeric) * 100, 2) AS error_rate_pct
      FROM heatmap_raw
      WHERE requests >= 5
      ORDER BY (errors::numeric / NULLIF(requests, 0)::numeric) DESC NULLS LAST
      LIMIT 3
    ) w
  )
  SELECT jsonb_build_object(
    'window_hours', _hours,
    'totals', (SELECT row_to_json(totals) FROM totals),
    'by_function', COALESCE((SELECT data FROM by_function), '[]'::jsonb),
    'by_model', COALESCE((SELECT data FROM by_model), '[]'::jsonb),
    'active_alerts', COALESCE((SELECT data FROM active_alerts), '[]'::jsonb),
    'resolved_recent', COALESCE((SELECT data FROM resolved_recent), '[]'::jsonb),
    'resolved_mttr', COALESCE((SELECT data FROM resolved_mttr), '[]'::jsonb),
    'error_heatmap', COALESCE((SELECT data FROM heatmap), '[]'::jsonb),
    'worst_windows', COALESCE((SELECT data FROM worst_windows), '[]'::jsonb),
    'generated_at', now()
  ) INTO _result;

  _dur_ms := EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000.0;
  PERFORM public.record_rpc_perf_sample('get_ai_gateway_health', _dur_ms);

  RETURN _result;
END;
$function$;

-- 5) Retention: keep 7d of samples
CREATE OR REPLACE FUNCTION public.cleanup_rpc_perf_samples()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rpc_perf_samples WHERE created_at < now() - interval '7 days';
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_rpc_perf_samples() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_rpc_perf_samples() TO service_role;

-- Schedule daily cleanup (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup_rpc_perf_samples_daily')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup_rpc_perf_samples_daily');
    PERFORM cron.schedule(
      'cleanup_rpc_perf_samples_daily',
      '15 3 * * *',
      $CRON$ SELECT public.cleanup_rpc_perf_samples(); $CRON$
    );
  END IF;
END $$;
