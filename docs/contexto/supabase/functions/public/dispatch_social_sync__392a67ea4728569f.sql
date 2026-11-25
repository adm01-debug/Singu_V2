CREATE OR REPLACE FUNCTION public.dispatch_social_sync(p_limit integer DEFAULT 25)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r record;
  v_secret text;
  v_url text := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/sync-social-interests';
  v_count integer := 0;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'dispatch_social_sync: p_limit precisa ser >= 1 (recebido %)', p_limit;
  END IF;

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret';

  IF v_secret IS NULL OR btrim(v_secret) = '' THEN
    RAISE EXCEPTION 'dispatch_social_sync: singu_cron_secret ausente no Vault; a edge function responderia 401 e a fila nao drenaria';
  END IF;

  FOR r IN
    SELECT id, contact_id
    FROM public.social_sync_queue
    WHERE status = 'pending'
      AND (last_attempt IS NULL OR last_attempt < now() - interval '3 minutes')
    ORDER BY created_at
    LIMIT p_limit
  LOOP
    PERFORM net.http_post(
      url     := v_url,
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', v_secret
      ),
      body    := jsonb_build_object('contactId', r.contact_id, 'queueId', r.id),
      timeout_milliseconds := 30000
    );
    UPDATE public.social_sync_queue SET last_attempt = now() WHERE id = r.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$function$
