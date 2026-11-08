CREATE OR REPLACE FUNCTION public.evaluate_ai_gateway_alerts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _dedup_window   timestamptz := now() - interval '2 hours';
  _requests       integer;
  _errors         integer;
  _error_rate     numeric;
  _p95            numeric;
  _severity       text;
  _alerts_created integer := 0;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status <> 'success'),
         percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
    INTO _requests, _errors, _p95
    FROM public.ai_gateway_metrics
   WHERE created_at >= now() - interval '15 minutes';

  IF _requests IS NULL OR _requests < 20 THEN
    RETURN 0;
  END IF;

  _error_rate := ROUND(_errors::numeric / NULLIF(_requests, 0) * 100, 2);

  IF _error_rate >= 5 AND NOT EXISTS (
    SELECT 1 FROM public.system_alerts
     WHERE alert_type = 'ai_gateway_error_rate' AND acknowledged_at IS NULL AND created_at >= _dedup_window
  ) THEN
    _severity := CASE WHEN _error_rate >= 10 THEN 'critical' ELSE 'high' END;
    INSERT INTO public.system_alerts (alert_type, severity, threshold_pct, consumed_pct, message, metadata)
    VALUES ('ai_gateway_error_rate', _severity, 5, _error_rate,
            format('Taxa de erro do AI Gateway em %s%% nos últimos 15 min (%s/%s chamadas)', _error_rate, _errors, _requests),
            jsonb_build_object('requests', _requests, 'errors', _errors, 'window_minutes', 15));
    _alerts_created := _alerts_created + 1;
  END IF;

  IF _p95 >= 8000 AND NOT EXISTS (
    SELECT 1 FROM public.system_alerts
     WHERE alert_type = 'ai_gateway_latency_p95' AND acknowledged_at IS NULL AND created_at >= _dedup_window
  ) THEN
    _severity := CASE WHEN _p95 >= 15000 THEN 'critical' ELSE 'high' END;
    INSERT INTO public.system_alerts (alert_type, severity, threshold_pct, consumed_pct, message, metadata)
    VALUES ('ai_gateway_latency_p95', _severity, 100, ROUND(_p95 / 8000 * 100, 2),
            format('Latência p95 do AI Gateway em %sms nos últimos 15 min (%s chamadas)', ROUND(_p95), _requests),
            jsonb_build_object('requests', _requests, 'p95_ms', ROUND(_p95), 'threshold_ms', 8000, 'window_minutes', 15));
    _alerts_created := _alerts_created + 1;
  END IF;

  RETURN _alerts_created;
END;
$function$
