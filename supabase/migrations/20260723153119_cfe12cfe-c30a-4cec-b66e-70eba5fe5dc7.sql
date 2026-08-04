
CREATE OR REPLACE FUNCTION public.get_ai_gateway_health(_hours integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  _result JSONB;
  _window_start TIMESTAMPTZ;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  _hours := GREATEST(1, LEAST(_hours, 24 * 30));
  _window_start := now() - make_interval(hours => _hours);

  SELECT jsonb_build_object(
    'window_hours', _hours,
    'computed_at', now(),
    'totals', COALESCE((
      SELECT jsonb_build_object(
        'requests', COUNT(*),
        'errors', COUNT(*) FILTER (WHERE status <> 'success'),
        'error_rate_pct', ROUND((COUNT(*) FILTER (WHERE status <> 'success'))::numeric
                          / NULLIF(COUNT(*),0) * 100, 2),
        'p50_ms', percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms),
        'p95_ms', percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms),
        'p99_ms', percentile_cont(0.99) WITHIN GROUP (ORDER BY duration_ms),
        'tokens_in', COALESCE(SUM(tokens_in), 0),
        'tokens_out', COALESCE(SUM(tokens_out), 0)
      )
      FROM public.ai_gateway_metrics
      WHERE created_at >= _window_start
    ), '{}'::jsonb),
    'by_function', COALESCE((
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.requests DESC)
      FROM (
        SELECT
          function_name,
          COUNT(*) AS requests,
          COUNT(*) FILTER (WHERE status <> 'success') AS errors,
          ROUND((COUNT(*) FILTER (WHERE status <> 'success'))::numeric
            / NULLIF(COUNT(*),0) * 100, 2) AS error_rate_pct,
          ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms)::numeric, 0) AS p50_ms,
          ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 0) AS p95_ms,
          MAX(created_at) AS last_seen
        FROM public.ai_gateway_metrics
        WHERE created_at >= _window_start
        GROUP BY function_name
      ) t
    ), '[]'::jsonb),
    'by_model', COALESCE((
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.requests DESC)
      FROM (
        SELECT
          COALESCE(model, 'unknown') AS model,
          COUNT(*) AS requests,
          COUNT(*) FILTER (WHERE status <> 'success') AS errors,
          ROUND((COUNT(*) FILTER (WHERE status <> 'success'))::numeric
            / NULLIF(COUNT(*),0) * 100, 2) AS error_rate_pct,
          ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY duration_ms)::numeric, 0) AS p50_ms,
          ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 0) AS p95_ms,
          COALESCE(SUM(tokens_in), 0) AS tokens_in,
          COALESCE(SUM(tokens_out), 0) AS tokens_out
        FROM public.ai_gateway_metrics
        WHERE created_at >= _window_start
        GROUP BY COALESCE(model, 'unknown')
      ) t
    ), '[]'::jsonb),
    'active_alerts', COALESCE((
      SELECT jsonb_agg(row_to_json(a) ORDER BY a.created_at DESC)
      FROM (
        SELECT
          id,
          alert_type,
          severity,
          title,
          message,
          metadata,
          created_at
        FROM public.system_alerts
        WHERE alert_type LIKE 'ai_gateway_%'
          AND resolved_at IS NULL
          AND created_at >= now() - interval '2 hours'
        ORDER BY created_at DESC
        LIMIT 20
      ) a
    ), '[]'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_ai_gateway_health(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_gateway_health(integer) TO authenticated;
