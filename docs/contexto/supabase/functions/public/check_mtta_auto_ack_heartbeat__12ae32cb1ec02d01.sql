CREATE OR REPLACE FUNCTION public.check_mtta_auto_ack_heartbeat()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  last_beat TIMESTAMPTZ;
  age_min INT;
  recent_alert BOOLEAN;
BEGIN
  SELECT MAX(timestamp) INTO last_beat
  FROM public.system_health_snapshots
  WHERE components->>'source' = 'cron_mtta_auto_ack'
    AND timestamp > now() - interval '24 hours';

  IF last_beat IS NULL THEN
    age_min := NULL;
  ELSE
    age_min := EXTRACT(EPOCH FROM (now() - last_beat)) / 60;
  END IF;

  IF age_min IS NOT NULL AND age_min <= 150 THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.system_alerts
    WHERE alert_type = 'mtta_auto_ack_heartbeat_stale'
      AND created_at > now() - interval '6 hours'
  ) INTO recent_alert;

  IF recent_alert THEN
    RETURN;
  END IF;

  INSERT INTO public.system_alerts (alert_type, severity, threshold_pct, consumed_pct, message, metadata)
  VALUES (
    'mtta_auto_ack_heartbeat_stale',
    'critical',
    150,
    COALESCE(age_min, 150),
    CASE
      WHEN age_min IS NULL THEN 'Cron mtta-sla-breach-auto-ack-hourly sem heartbeat nas últimas 24h'
      ELSE format('Cron mtta-sla-breach-auto-ack-hourly travado há %s min (SLA 150min)', age_min)
    END,
    jsonb_build_object(
      'age_minutes', age_min,
      'threshold_minutes', 150,
      'last_beat', last_beat,
      'cron_job', 'mtta-sla-breach-auto-ack-hourly'
    )
  );
END;
$function$
