CREATE OR REPLACE FUNCTION public.get_webhooks_for_event(p_event text)
 RETURNS TABLE(webhook_id uuid, url text, secret text, headers jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id, url, secret, headers FROM webhooks
  WHERE is_active = true AND p_event = ANY(events) AND failure_count < 5;
$function$
