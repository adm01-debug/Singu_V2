CREATE OR REPLACE FUNCTION public.increment_webhook_quota(_webhook_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_period date := date_trunc('month', now())::date;
  v_quota public.connection_quotas%ROWTYPE;
BEGIN
  INSERT INTO public.connection_quotas (webhook_id, period_start)
  VALUES (_webhook_id, v_period)
  ON CONFLICT (webhook_id, period_start) DO NOTHING;

  UPDATE public.connection_quotas
  SET calls_used = calls_used + 1,
      updated_at = now()
  WHERE webhook_id = _webhook_id AND period_start = v_period
  RETURNING * INTO v_quota;

  RETURN jsonb_build_object(
    'calls_used', v_quota.calls_used,
    'calls_limit', v_quota.calls_limit,
    'overage_blocked', v_quota.overage_blocked,
    'exceeded', v_quota.calls_used > v_quota.calls_limit
  );
END;
$function$
