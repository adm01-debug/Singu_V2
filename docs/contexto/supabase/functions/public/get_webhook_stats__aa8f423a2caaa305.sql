CREATE OR REPLACE FUNCTION public.get_webhook_stats(p_days integer DEFAULT 7)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total_executions', (SELECT COUNT(*) FROM webhook_logs WHERE created_at >= NOW() - (p_days || ' days')::interval),
    'successful', (SELECT COUNT(*) FROM webhook_logs WHERE success = true AND created_at >= NOW() - (p_days || ' days')::interval),
    'failed', (SELECT COUNT(*) FROM webhook_logs WHERE success = false AND created_at >= NOW() - (p_days || ' days')::interval),
    'success_rate', ROUND((SELECT COUNT(*) FILTER (WHERE success = true)::numeric / NULLIF(COUNT(*), 0) * 100 FROM webhook_logs WHERE created_at >= NOW() - (p_days || ' days')::interval), 1)
  );
END;
$function$
