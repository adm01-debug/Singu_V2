CREATE OR REPLACE FUNCTION public.get_ai_gateway_health(_hours int DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _since timestamptz := now() - make_interval(hours => _hours);
  _result jsonb;
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
      SELECT
        function_name,
        COUNT(*)::int AS requests,
        COUNT(*) FILTER (WHERE status_code >= 400 OR error IS NOT NULL)::int AS errors,
        ROUND((COUNT(*) FILTER (WHERE status_code >= 400 OR error IS NOT NULL)::numeric
               / NULLIF(COUNT(*), 0)::numeric) * 100, 2) AS error_rate_pct,
        ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS p50_ms,
        ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS p95_ms,
        MAX(created_at) AS last_seen
      FROM base
      GROUP BY function_name
    ) f
  ),
  by_model AS (
    SELECT jsonb_agg(row_to_json(m) ORDER BY m.requests DESC) AS data
    FROM (
      SELECT
        COALESCE(model, 'unknown') AS model,
        COUNT(*)::int AS requests,
        COUNT(*) FILTER (WHERE status_code >= 400 OR error IS NOT NULL)::int AS errors,
        ROUND((COUNT(*) FILTER (WHERE status_code >= 400 OR error IS NOT NULL)::numeric
               / NULLIF(COUNT(*), 0)::numeric) * 100, 2) AS error_rate_pct,
        ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS p50_ms,
        ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 0) AS p95_ms,
        COALESCE(SUM(tokens_in), 0)::bigint AS tokens_in,
        COALESCE(SUM(tokens_out), 0)::bigint AS tokens_out
      FROM base
      GROUP BY COALESCE(model, 'unknown')
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
      ORDER BY created_at DESC
      LIMIT 20
    ) a
  ),
  resolved_recent AS (
    SELECT jsonb_agg(row_to_json(r) ORDER BY r.acknowledged_at DESC) AS data
    FROM (
      SELECT
        id, alert_type, severity, message, created_at, acknowledged_at,
        ROUND(EXTRACT(EPOCH FROM (acknowledged_at - created_at))::numeric / 60.0, 1) AS mttr_minutes,
        (metadata->>'auto_resolved')::boolean AS auto_resolved
      FROM public.system_alerts
      WHERE alert_type LIKE 'ai_gateway_%'
        AND acknowledged_at IS NOT NULL
        AND acknowledged_at >= now() - interval '24 hours'
      ORDER BY acknowledged_at DESC
      LIMIT 10
    ) r
  ),
  resolved_mttr AS (
    SELECT jsonb_agg(row_to_json(mt) ORDER BY mt.alert_type) AS data
    FROM (
      SELECT
        alert_type,
        COUNT(*)::int AS resolved_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)))::numeric / 60.0, 1) AS avg_mttr_minutes,
        ROUND(MAX(EXTRACT(EPOCH FROM (acknowledged_at - created_at)))::numeric / 60.0, 1) AS max_mttr_minutes
      FROM public.system_alerts
      WHERE alert_type LIKE 'ai_gateway_%'
        AND acknowledged_at IS NOT NULL
        AND acknowledged_at >= now() - interval '24 hours'
      GROUP BY alert_type
    ) mt
  )
  SELECT jsonb_build_object(
    'window_hours', _hours,
    'computed_at', now(),
    'totals', COALESCE(to_jsonb(t.*), '{}'::jsonb),
    'by_function', COALESCE((SELECT data FROM by_function), '[]'::jsonb),
    'by_model', COALESCE((SELECT data FROM by_model), '[]'::jsonb),
    'active_alerts', COALESCE((SELECT data FROM active_alerts), '[]'::jsonb),
    'resolved_recent', COALESCE((SELECT data FROM resolved_recent), '[]'::jsonb),
    'resolved_mttr', COALESCE((SELECT data FROM resolved_mttr), '[]'::jsonb)
  )
  INTO _result
  FROM totals t;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_ai_gateway_health(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_gateway_health(int) TO authenticated, service_role;