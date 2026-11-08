CREATE OR REPLACE FUNCTION zapp_history.request_embedding(p_texts jsonb, p_provider text DEFAULT 'qwen3-embedding-8b'::text, p_task text DEFAULT 'retrieval.passage'::text)
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
    url := v_url || '/rag-embed-v2',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('texts', p_texts, 'provider', p_provider, 'task', p_task),
    timeout_milliseconds := 60000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$function$
