
-- Fix rodada 53 RPC: system_alerts has no resolved_at/title columns
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
          message,
          metadata,
          created_at
        FROM public.system_alerts
        WHERE alert_type LIKE 'ai_gateway_%'
          AND acknowledged_at IS NULL
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

-- Auto-resolve stale ai_gateway alerts when metrics recovered
CREATE OR REPLACE FUNCTION public.auto_resolve_ai_gateway_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _window_start TIMESTAMPTZ := now() - INTERVAL '15 minutes';
  _requests INTEGER;
  _errors INTEGER;
  _error_rate NUMERIC;
  _p95 NUMERIC;
  _resolved INTEGER := 0;
  _now TIMESTAMPTZ := now();
BEGIN
  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE status <> 'success'),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
    INTO _requests, _errors, _p95
    FROM public.ai_gateway_metrics
    WHERE created_at >= _window_start;

  IF _requests IS NULL OR _requests < 20 THEN
    RETURN 0;
  END IF;

  _error_rate := ROUND(_errors::numeric / NULLIF(_requests, 0) * 100, 2);

  -- Resolve error-rate alerts if back under 3%
  IF _error_rate < 3 THEN
    WITH upd AS (
      UPDATE public.system_alerts
         SET acknowledged_at = _now,
             metadata = metadata || jsonb_build_object(
               'auto_resolved', true,
               'resolved_at', _now,
               'recovery_error_rate_pct', _error_rate,
               'recovery_requests', _requests
             )
       WHERE alert_type = 'ai_gateway_error_rate'
         AND acknowledged_at IS NULL
      RETURNING 1
    )
    SELECT _resolved + COUNT(*) INTO _resolved FROM upd;
  END IF;

  -- Resolve latency alerts if back under 6s
  IF _p95 IS NOT NULL AND _p95 < 6000 THEN
    WITH upd AS (
      UPDATE public.system_alerts
         SET acknowledged_at = _now,
             metadata = metadata || jsonb_build_object(
               'auto_resolved', true,
               'resolved_at', _now,
               'recovery_p95_ms', ROUND(_p95),
               'recovery_requests', _requests
             )
       WHERE alert_type = 'ai_gateway_latency_p95'
         AND acknowledged_at IS NULL
      RETURNING 1
    )
    SELECT _resolved + COUNT(*) INTO _resolved FROM upd;
  END IF;

  RETURN _resolved;
END;
$function$;

REVOKE ALL ON FUNCTION public.auto_resolve_ai_gateway_alerts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_resolve_ai_gateway_alerts() TO service_role;

-- Schedule alongside the evaluator (every 5 min, offset 2 min)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'auto_resolve_ai_gateway_alerts';
    PERFORM cron.schedule(
      'auto_resolve_ai_gateway_alerts',
      '2-59/5 * * * *',
      $cron$ SELECT public.auto_resolve_ai_gateway_alerts(); $cron$
    );
  END IF;
END $$;
