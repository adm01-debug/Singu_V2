CREATE OR REPLACE FUNCTION public.enqueue_social_sync(p_limit integer DEFAULT 500, p_stale_days integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_inserted integer;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'enqueue_social_sync: p_limit precisa ser >= 1 (recebido %)', p_limit;
  END IF;
  IF p_stale_days IS NULL OR p_stale_days < 1 THEN
    RAISE EXCEPTION 'enqueue_social_sync: p_stale_days precisa ser >= 1 (recebido %)', p_stale_days;
  END IF;

  WITH candidato AS (
    SELECT c.id AS contact_id, max(i.created_at) AS ultima_interacao
    FROM public.contacts c
    JOIN public.interactions i ON i.contact_id = c.id
    WHERE (
        nullif(btrim(coalesce(i.conteudo, '')), '') IS NOT NULL
        OR nullif(btrim(coalesce(i.content, '')), '') IS NOT NULL
        OR nullif(btrim(coalesce(i.assunto, '')), '') IS NOT NULL
        OR nullif(btrim(coalesce(i.resumo, '')), '') IS NOT NULL
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.social_sync_queue q
        WHERE q.contact_id = c.id AND q.status IN ('pending', 'processing')
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.social_behavior_analysis a
        WHERE a.contact_id = c.id
          AND a.analysis_date > now() - make_interval(days => p_stale_days)
      )
    GROUP BY c.id
    ORDER BY max(i.created_at) DESC
    LIMIT p_limit
  ), inserido AS (
    INSERT INTO public.social_sync_queue (contact_id, status, retry_count)
    SELECT contact_id, 'pending', 0 FROM candidato
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM inserido;

  RETURN v_inserted;
END;
$function$
