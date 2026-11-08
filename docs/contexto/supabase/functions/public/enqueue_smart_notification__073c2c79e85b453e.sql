CREATE OR REPLACE FUNCTION public.enqueue_smart_notification(_event_type text, _title text, _body text DEFAULT NULL::text, _entity_type text DEFAULT NULL::text, _entity_id text DEFAULT NULL::text, _urgency text DEFAULT 'normal'::text, _bundle_key text DEFAULT NULL::text, _action_url text DEFAULT NULL::text, _payload jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _existing UUID;
  _new_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  IF _bundle_key IS NOT NULL THEN
    SELECT id INTO _existing
    FROM public.smart_notifications
    WHERE user_id = auth.uid()
      AND bundle_key = _bundle_key
      AND status IN ('pending','delivered','snoozed')
      AND created_at > now() - INTERVAL '6 hours'
    ORDER BY created_at DESC LIMIT 1;

    IF _existing IS NOT NULL THEN
      UPDATE public.smart_notifications
      SET bundle_count = bundle_count + 1,
          payload = payload || jsonb_build_object('last_bundle_at', now()),
          urgency = CASE
            WHEN _urgency = 'critical' THEN 'critical'
            WHEN urgency = 'critical' THEN 'critical'
            WHEN _urgency = 'high' OR urgency = 'high' THEN 'high'
            ELSE urgency
          END
      WHERE id = _existing;
      RETURN _existing;
    END IF;
  END IF;

  INSERT INTO public.smart_notifications (
    user_id, event_type, entity_type, entity_id, title, body,
    payload, urgency, bundle_key, action_url, decided_channel, decision_reason
  ) VALUES (
    auth.uid(), _event_type, _entity_type, _entity_id, _title, _body,
    COALESCE(_payload, '{}'::jsonb), _urgency, _bundle_key, _action_url,
    'in_app', 'manual_enqueue'
  ) RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$function$
