CREATE OR REPLACE FUNCTION public.get_ai_gateway_health(_hours integer DEFAULT 24)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _since  timestamptz := now() - make_interval(hours => _hours);
  _t0     timestamptz := clock_timestamp();
  _result jsonb;
BEGIN
  IF NOT (current_setting('role') IN ('postgres', 'service_role')
          OR (current_setting('role') = 'none' AND session_user = 'postgres'))
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access_denied' USING ERRCODE = '42501';
  END IF;

  WITH base AS (
    SELECT function_name, model, status, duration_ms, tokens_in, tokens_out, created_at,
           (status <> 'success') AS is_error,
           (created_at AT TIME ZONE 'America/Sao_Paulo') AS local_ts
      FROM public.ai_gateway_metrics
     WHERE created_at >= _since
  ),
  totals AS (
    SELECT COUNT(*)::int AS requests,
           COUNT(*) FILTER (WHERE is_error)::int AS errors,
           ROUND(COUNT(*) FILTER (WHERE is_error)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS error_rate_pct,
           ROUND((percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p50_ms,
           ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p95_ms,
           ROUND((percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p99_ms,
           COALESCE(SUM(tokens_in), 0)::bigint AS tokens_in,
           COALESCE(SUM(tokens_out), 0)::bigint AS tokens_out
      FROM base
  ),
  by_function AS (
    SELECT jsonb_agg(row_to_json(f) ORDER BY f.requests DESC) AS data
      FROM (
        SELECT function_name,
               COUNT(*)::int AS requests,
               COUNT(*) FILTER (WHERE is_error)::int AS errors,
               ROUND(COUNT(*) FILTER (WHERE is_error)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS error_rate_pct,
               ROUND((percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p50_ms,
               ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p95_ms,
               MAX(created_at) AS last_seen
          FROM base GROUP BY function_name
      ) f
  ),
  by_model AS (
    SELECT jsonb_agg(row_to_json(m) ORDER BY m.requests DESC) AS data
      FROM (
        SELECT COALESCE(model, 'unknown') AS model,
               COUNT(*)::int AS requests,
               COUNT(*) FILTER (WHERE is_error)::int AS errors,
               ROUND(COUNT(*) FILTER (WHERE is_error)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS error_rate_pct,
               ROUND((percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p50_ms,
               ROUND((percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms))::numeric, 0) AS p95_ms,
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
         ORDER BY created_at DESC
         LIMIT 20
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
           AND acknowledged_at >= now() - interval '24 hours'
         ORDER BY acknowledged_at DESC
         LIMIT 10
      ) r
  ),
  resolved_mttr AS (
    SELECT jsonb_agg(row_to_json(mt) ORDER BY mt.alert_type) AS data
      FROM (
        SELECT alert_type,
               COUNT(*)::int AS resolved_count,
               ROUND(AVG(EXTRACT(EPOCH FROM (acknowledged_at - created_at)))::numeric / 60.0, 1) AS avg_mttr_minutes,
               ROUND(MAX(EXTRACT(EPOCH FROM (acknowledged_at - created_at)))::numeric / 60.0, 1) AS max_mttr_minutes
          FROM public.system_alerts
         WHERE alert_type LIKE 'ai_gateway_%'
           AND acknowledged_at >= now() - interval '24 hours'
         GROUP BY alert_type
      ) mt
  ),
  heatmap_raw AS (
    SELECT EXTRACT(ISODOW FROM local_ts)::int AS dow,
           EXTRACT(HOUR FROM local_ts)::int AS hour,
           COUNT(*)::int AS requests,
           COUNT(*) FILTER (WHERE is_error)::int AS errors
      FROM base
     GROUP BY 1, 2
  ),
  heatmap AS (
    SELECT jsonb_agg(row_to_json(h) ORDER BY h.dow, h.hour) AS data
      FROM (
        SELECT dow, hour, requests, errors,
               ROUND(errors::numeric / NULLIF(requests, 0) * 100, 2) AS error_rate_pct
          FROM heatmap_raw
      ) h
  ),
  worst_windows AS (
    SELECT jsonb_agg(row_to_json(w) ORDER BY w.error_rate_pct DESC) AS data
      FROM (
        SELECT dow, hour, requests, errors,
               ROUND(errors::numeric / NULLIF(requests, 0) * 100, 2) AS error_rate_pct
          FROM heatmap_raw
         WHERE requests >= 5
         ORDER BY errors::numeric / NULLIF(requests, 0) DESC NULLS LAST
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
           'computed_at', now()
         )
    INTO _result;

  PERFORM public.record_rpc_perf_sample(
    'get_ai_gateway_health', EXTRACT(EPOCH FROM (clock_timestamp() - _t0)) * 1000.0
  );
  RETURN _result;
END;
$function$
