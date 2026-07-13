
CREATE OR REPLACE FUNCTION public.simulate_behavioral_regen_alert(
  _alert_type text DEFAULT 'behavioral_regen_cron_stale',
  _severity text DEFAULT 'critical'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  IF _alert_type NOT IN ('behavioral_regen_error_rate','behavioral_regen_cron_stale') THEN
    RAISE EXCEPTION 'invalid alert_type';
  END IF;

  IF _severity NOT IN ('warning','critical') THEN
    RAISE EXCEPTION 'invalid severity';
  END IF;

  INSERT INTO public.system_alerts (
    alert_type, severity, threshold_pct, consumed_pct, message, metadata
  ) VALUES (
    _alert_type,
    _severity,
    CASE WHEN _alert_type = 'behavioral_regen_cron_stale' THEN 30 ELSE 20 END,
    CASE WHEN _alert_type = 'behavioral_regen_cron_stale' THEN 999 ELSE 87 END,
    format('[SIMULAÇÃO] %s disparado manualmente por admin', _alert_type),
    jsonb_build_object(
      'simulated', true,
      'jobname', 'process-behavioral-regen-queue-5min',
      'triggered_by', auth.uid()
    )
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.simulate_behavioral_regen_alert(text, text) TO authenticated;
