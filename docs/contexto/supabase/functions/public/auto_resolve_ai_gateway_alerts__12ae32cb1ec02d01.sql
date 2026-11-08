CREATE OR REPLACE FUNCTION public.auto_resolve_ai_gateway_alerts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _requests   integer;
  _errors     integer;
  _error_rate numeric;
  _p95        numeric;
  _resolved   integer := 0;
  _n          integer;
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

  IF _error_rate < 3 THEN
    UPDATE public.system_alerts
       SET acknowledged_at = now(),
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
             'auto_resolved', true, 'resolved_at', now(),
             'recovery_error_rate_pct', _error_rate, 'recovery_requests', _requests)
     WHERE alert_type = 'ai_gateway_error_rate' AND acknowledged_at IS NULL;
    GET DIAGNOSTICS _n = ROW_COUNT;
    _resolved := _resolved + _n;
  END IF;

  IF _p95 < 6000 THEN
    UPDATE public.system_alerts
       SET acknowledged_at = now(),
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
             'auto_resolved', true, 'resolved_at', now(),
             'recovery_p95_ms', ROUND(_p95), 'recovery_requests', _requests)
     WHERE alert_type = 'ai_gateway_latency_p95' AND acknowledged_at IS NULL;
    GET DIAGNOSTICS _n = ROW_COUNT;
    _resolved := _resolved + _n;
  END IF;

  RETURN _resolved;
END;
$function$
