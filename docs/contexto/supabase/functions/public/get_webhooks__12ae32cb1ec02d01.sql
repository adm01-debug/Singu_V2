CREATE OR REPLACE FUNCTION public.get_webhooks()
 RETURNS TABLE(webhook_id uuid, name text, url text, events text[], is_active boolean, last_triggered timestamp with time zone, failure_count integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id, name, url, events, is_active, last_triggered_at, failure_count FROM webhooks ORDER BY created_at DESC;
$function$
