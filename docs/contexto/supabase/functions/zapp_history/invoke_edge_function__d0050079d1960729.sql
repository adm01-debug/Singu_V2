CREATE OR REPLACE FUNCTION zapp_history.invoke_edge_function(p_function_name text, p_body jsonb DEFAULT '{}'::jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_url TEXT;
  v_request_id BIGINT;
BEGIN
  v_url := zapp_history.get_config('functions_base_url');
  IF v_url IS NULL THEN
    v_url := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1';
  END IF;

  SELECT net.http_post(
    url := v_url || '/' || p_function_name,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := p_body,
    timeout_milliseconds := 30000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$function$
