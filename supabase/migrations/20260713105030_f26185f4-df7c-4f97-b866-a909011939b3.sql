
CREATE OR REPLACE FUNCTION public.check_behavioral_regen_cron_staleness()
RETURNS TABLE (job text, minutes_since_last_run int, alert_created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, cron
AS $$
DECLARE
  r RECORD;
  mins int;
  expected_max int;
  existing_alert uuid;
  created boolean;
BEGIN
  FOR r IN
    SELECT j.jobid, j.jobname, j.active,
           (SELECT max(d.start_time) FROM cron.job_run_details d WHERE d.jobid = j.jobid) AS last_run
    FROM cron.job j
    WHERE j.jobname IN (
      'process-behavioral-regen-queue-5min',
      'cleanup-behavioral-regen-queue-daily'
    )
  LOOP
    IF r.last_run IS NULL THEN
      mins := 999999;
    ELSE
      mins := FLOOR(EXTRACT(EPOCH FROM (now() - r.last_run)) / 60)::int;
    END IF;

    expected_max := CASE WHEN r.jobname LIKE '%5min%' THEN 30 ELSE 60 * 26 END;
    created := false;

    IF r.active AND mins > expected_max THEN
      SELECT id INTO existing_alert
      FROM public.system_alerts
      WHERE alert_type = 'behavioral_regen_cron_stale'
        AND (metadata->>'jobname') = r.jobname
        AND acknowledged_at IS NULL
      LIMIT 1;

      IF existing_alert IS NULL THEN
        INSERT INTO public.system_alerts (
          alert_type, severity, threshold_pct, consumed_pct, message, metadata
        ) VALUES (
          'behavioral_regen_cron_stale',
          CASE WHEN mins > expected_max * 2 THEN 'critical' ELSE 'warning' END,
          expected_max,
          mins,
          format('Cron "%s" sem executar há %s min (esperado ≤ %s min)', r.jobname, mins, expected_max),
          jsonb_build_object('jobname', r.jobname, 'last_run', r.last_run, 'expected_max_min', expected_max)
        );
        created := true;
      END IF;
    END IF;

    job := r.jobname;
    minutes_since_last_run := mins;
    alert_created := created;
    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_behavioral_regen_cron_staleness() TO service_role;
