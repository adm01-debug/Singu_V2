
CREATE OR REPLACE FUNCTION public.publish_mtta_sla_breach_alert(
  _mtta_minutes integer,
  _sla_minutes integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NULL;
  END IF;

  -- Auto-ack de breaches anteriores com mais de 24h (rolagem SLO)
  UPDATE public.system_alerts
     SET acknowledged_at = now(),
         acknowledged_by = auth.uid()
   WHERE alert_type = 'mtta_critical_sla_breach'
     AND acknowledged_at IS NULL
     AND created_at < now() - interval '24 hours';

  -- Dedup: já existe breach não reconhecido nas últimas 24h → não duplica
  IF EXISTS (
    SELECT 1 FROM public.system_alerts
     WHERE alert_type = 'mtta_critical_sla_breach'
       AND acknowledged_at IS NULL
       AND created_at >= now() - interval '24 hours'
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.system_alerts(
    alert_type, severity, threshold_pct, consumed_pct, message, metadata
  )
  VALUES (
    'mtta_critical_sla_breach',
    'warning',
    _sla_minutes,
    _mtta_minutes,
    format('MTTA crítico (%s min) excedeu SLA de %s min', _mtta_minutes, _sla_minutes),
    jsonb_build_object(
      'source', 'behavioral_regen_alerts',
      'metric', 'mtta_critical_minutes',
      'value', _mtta_minutes,
      'sla_minutes', _sla_minutes,
      'auto_ack_after_hours', 24
    )
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_mtta_sla_breach_alert(integer, integer) TO authenticated;
