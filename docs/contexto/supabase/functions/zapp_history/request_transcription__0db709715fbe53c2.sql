CREATE OR REPLACE FUNCTION zapp_history.request_transcription(p_audio_base64 text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE v_url TEXT; v_request_id BIGINT;
BEGIN
  v_url := COALESCE(zapp_history.get_config('functions_base_url'),
                    'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1');
  SELECT net.http_post(
    url := v_url || '/media-pipeline',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('action', 'transcribe', 'audio_base64', p_audio_base64),
    timeout_milliseconds := 120000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$function$
