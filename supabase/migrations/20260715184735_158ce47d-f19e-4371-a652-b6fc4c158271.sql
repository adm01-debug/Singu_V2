-- Cron horário para auto-ack de breaches MTTA-SLA >24h sem depender de trigger client-side
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
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_ack_stale_mtta_sla_breaches() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auto_ack_stale_mtta_sla_breaches() TO service_role;

-- Agenda (idempotente): remove job anterior de mesmo nome antes de criar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mtta-sla-breach-auto-ack-hourly') THEN
    PERFORM cron.unschedule('mtta-sla-breach-auto-ack-hourly');
  END IF;
  PERFORM cron.schedule(
    'mtta-sla-breach-auto-ack-hourly',
    '7 * * * *',
    $cron$SELECT public.auto_ack_stale_mtta_sla_breaches();$cron$
  );
END $$;