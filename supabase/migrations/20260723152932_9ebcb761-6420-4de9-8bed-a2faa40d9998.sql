
CREATE OR REPLACE FUNCTION public.evaluate_ai_gateway_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window_start TIMESTAMPTZ := now() - INTERVAL '15 minutes';
  _dedup_window TIMESTAMPTZ := now() - INTERVAL '2 hours';
  _requests INTEGER;
  _errors INTEGER;
  _error_rate NUMERIC;
  _p95 NUMERIC;
  _severity TEXT;
  _alerts_created INTEGER := 0;
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

  -- Error rate alert
  IF _error_rate >= 5 THEN
    _severity := CASE WHEN _error_rate >= 10 THEN 'critical' ELSE 'high' END;
    IF NOT EXISTS (
      SELECT 1 FROM public.system_alerts
      WHERE alert_type = 'ai_gateway_error_rate'
        AND acknowledged_at IS NULL
        AND created_at >= _dedup_window
    ) THEN
      INSERT INTO public.system_alerts (alert_type, severity, threshold_pct, consumed_pct, message, metadata)
      VALUES (
        'ai_gateway_error_rate',
        _severity,
        5,
        _error_rate,
        format('Taxa de erro do AI Gateway em %s%% nos últimos 15 min (%s/%s chamadas)',
               _error_rate, _errors, _requests),
        jsonb_build_object('requests', _requests, 'errors', _errors, 'window_minutes', 15)
      );
      _alerts_created := _alerts_created + 1;
    END IF;
  END IF;

  -- Latency p95 alert
  IF _p95 IS NOT NULL AND _p95 >= 8000 THEN
    _severity := CASE WHEN _p95 >= 15000 THEN 'critical' ELSE 'high' END;
    IF NOT EXISTS (
      SELECT 1 FROM public.system_alerts
      WHERE alert_type = 'ai_gateway_latency_p95'
        AND acknowledged_at IS NULL
        AND created_at >= _dedup_window
    ) THEN
      INSERT INTO public.system_alerts (alert_type, severity, threshold_pct, consumed_pct, message, metadata)
      VALUES (
        'ai_gateway_latency_p95',
        _severity,
        8000,
        _p95,
        format('Latência p95 do AI Gateway em %sms nos últimos 15 min (%s chamadas)',
               ROUND(_p95), _requests),
        jsonb_build_object('requests', _requests, 'p95_ms', ROUND(_p95), 'window_minutes', 15)
      );
      _alerts_created := _alerts_created + 1;
    END IF;
  END IF;

  RETURN _alerts_created;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.evaluate_ai_gateway_alerts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_ai_gateway_alerts() TO service_role;

-- Schedule: every 5 minutes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('ai-gateway-alerts-eval');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'ai-gateway-alerts-eval',
  '*/5 * * * *',
  $$SELECT public.evaluate_ai_gateway_alerts();$$
);
