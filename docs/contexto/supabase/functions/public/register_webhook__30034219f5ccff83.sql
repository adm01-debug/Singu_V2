CREATE OR REPLACE FUNCTION public.register_webhook(p_name text, p_url text, p_events text[], p_secret text DEFAULT NULL::text, p_headers jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO webhook_endpoints (name, url, events, secret, headers) VALUES (p_name, p_url, p_events, p_secret, p_headers) RETURNING id INTO v_id;
  RETURN jsonb_build_object('success', true, 'webhook_id', v_id);
END;
$function$
