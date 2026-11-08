CREATE OR REPLACE FUNCTION public.create_webhook(p_name text, p_url text, p_events text[], p_secret text DEFAULT NULL::text, p_headers jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_id uuid;
BEGIN
  INSERT INTO webhooks (name, url, events, secret, headers, created_by)
  VALUES (p_name, p_url, p_events, p_secret, p_headers, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
