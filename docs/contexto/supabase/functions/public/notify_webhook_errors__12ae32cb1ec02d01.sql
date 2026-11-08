CREATE OR REPLACE FUNCTION public.notify_webhook_errors()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  hourly_errors INT;
  wh_name TEXT;
  owner_id UUID;
BEGIN
  IF NEW.status <> 'error' THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO hourly_errors
  FROM public.incoming_webhook_logs
  WHERE webhook_id = NEW.webhook_id
    AND status = 'error'
    AND created_at >= now() - interval '1 hour';

  IF hourly_errors = 10 THEN
    SELECT name, created_by INTO wh_name, owner_id
    FROM public.incoming_webhooks WHERE id = NEW.webhook_id;

    INSERT INTO public.smart_notifications (
      user_id, event_type, title, body, urgency,
      entity_type, entity_id, decided_channel, payload
    ) VALUES (
      owner_id, 'connection_alert',
      'Webhook "' || COALESCE(wh_name, 'desconhecido') || '" com alta taxa de erro',
      '10+ falhas registradas na última hora.',
      'high', 'webhook', NEW.webhook_id, 'in_app',
      jsonb_build_object('reason', 'webhook_error_burst', 'count_1h', hourly_errors)
    );
  END IF;

  RETURN NEW;
END;
$function$
