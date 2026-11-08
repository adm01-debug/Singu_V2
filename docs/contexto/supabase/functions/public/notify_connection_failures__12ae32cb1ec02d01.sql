CREATE OR REPLACE FUNCTION public.notify_connection_failures()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  recent_failures INT;
  conn_name TEXT;
  owner_id UUID;
BEGIN
  IF NEW.status <> 'error' THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO recent_failures
  FROM (
    SELECT status FROM public.connection_test_logs
    WHERE connection_id = NEW.connection_id
    ORDER BY created_at DESC
    LIMIT 5
  ) recent
  WHERE status = 'error';

  IF recent_failures >= 5 THEN
    SELECT name, created_by INTO conn_name, owner_id
    FROM public.connection_configs WHERE id = NEW.connection_id;

    INSERT INTO public.smart_notifications (
      user_id, event_type, title, body, urgency,
      entity_type, entity_id, decided_channel, payload
    ) VALUES (
      owner_id, 'connection_alert',
      'Conexão "' || COALESCE(conn_name, 'desconhecida') || '" com falhas consecutivas',
      '5 ou mais testes falharam recentemente. Verifique credenciais e endpoint.',
      'high', 'connection', NEW.connection_id, 'in_app',
      jsonb_build_object('reason', 'consecutive_failures', 'count', recent_failures)
    );
  END IF;

  RETURN NEW;
END;
$function$
