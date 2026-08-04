
CREATE OR REPLACE FUNCTION public.auto_ack_stale_mtta_sla_breaches()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.system_alerts
     SET acknowledged_at = now(),
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('auto_ack_reason', 'sla_window_expired')
   WHERE alert_type = 'mtta_critical_sla_breach'
     AND acknowledged_at IS NULL
     AND created_at < now() - interval '24 hours';
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Heartbeat: registra execução do cron para observabilidade (detecta cron travado).
  INSERT INTO public.system_health_snapshots (status, components)
  VALUES (
    'healthy',
    jsonb_build_object(
      'source', 'cron_mtta_auto_ack',
      'acked_count', v_count,
      'ran_at', now()
    )
  );

  RETURN v_count;
END;
$$;
