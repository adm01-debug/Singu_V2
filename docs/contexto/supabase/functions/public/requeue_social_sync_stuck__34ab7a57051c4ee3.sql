CREATE OR REPLACE FUNCTION public.requeue_social_sync_stuck(p_stuck_minutes integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer;
BEGIN
  IF p_stuck_minutes IS NULL OR p_stuck_minutes < 1 THEN
    RAISE EXCEPTION 'requeue_social_sync_stuck: p_stuck_minutes precisa ser >= 1 (recebido %)', p_stuck_minutes;
  END IF;

  WITH reciclado AS (
    UPDATE public.social_sync_queue q
    SET status = 'pending',
        retry_count = q.retry_count + 1,
        error_log = 'reagendado apos ficar preso em processing/failed',
        updated_at = now()
    WHERE q.retry_count < coalesce(q.max_retries, 3)
      AND (
        (q.status = 'processing' AND q.last_attempt < now() - make_interval(mins => p_stuck_minutes))
        OR (q.status = 'failed' AND coalesce(q.last_attempt, q.created_at) < now() - make_interval(mins => p_stuck_minutes * 4))
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM reciclado;

  RETURN v_count;
END;
$function$
