CREATE OR REPLACE FUNCTION zapp_history.request_nlp(p_text text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_url TEXT;
  v_request_id BIGINT;
BEGIN
  v_url := COALESCE(zapp_history.get_config('functions_base_url'),
                    'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1');
  SELECT net.http_post(
    url := v_url || '/nlp-pipeline',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('text', p_text),
    timeout_milliseconds := 30000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$function$
