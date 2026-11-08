CREATE OR REPLACE FUNCTION public.notify_critical_next_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE _contact_name TEXT;
BEGIN
  IF NEW.urgency <> 'critical' THEN RETURN NEW; END IF;

  SELECT (first_name || ' ' || last_name) INTO _contact_name
  FROM public.contacts WHERE id = NEW.contact_id;

  INSERT INTO public.smart_notifications (
    user_id, event_type, entity_type, entity_id, title, body,
    urgency, bundle_key, decided_channel, decision_reason, action_url, payload
  ) VALUES (
    NEW.user_id,
    'next_action_critical',
    'contact',
    NEW.contact_id::text,
    'Ação urgente: ' || COALESCE(_contact_name, 'contato'),
    NEW.action,
    'critical',
    'next_action:' || NEW.contact_id::text,
    'in_app',
    'auto_trigger_critical_action',
    '/contatos/' || NEW.contact_id::text,
    jsonb_build_object('reason', NEW.reason, 'channel_suggested', NEW.channel)
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$
