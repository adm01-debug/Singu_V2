CREATE OR REPLACE FUNCTION public.create_webhook(p_name text, p_url text, p_events text[], p_secret text DEFAULT NULL::text, p_headers jsonb DEFAULT '{}'::jsonb, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO webhooks (name, url, events, secret, headers, created_by)
  VALUES (p_name, p_url, p_events, p_secret, p_headers, p_user_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
