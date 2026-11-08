CREATE OR REPLACE FUNCTION public.get_webhooks(p_active_only boolean DEFAULT true)
 RETURNS TABLE(webhook_id uuid, name text, url text, events text[], is_active boolean, last_success timestamp with time zone, success_rate numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT w.id, w.name::text, w.url::text, w.events, w.is_active,
    (SELECT MAX(created_at) FROM webhook_logs WHERE webhook_id = w.id AND success = true),
    ROUND((SELECT COUNT(*) FILTER (WHERE success = true)::numeric / NULLIF(COUNT(*), 0) * 100 FROM webhook_logs WHERE webhook_id = w.id), 1)
  FROM webhook_endpoints w WHERE NOT p_active_only OR w.is_active = true ORDER BY w.name;
END;
$function$
