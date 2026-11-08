CREATE OR REPLACE FUNCTION public.cleanup_behavioral_regen_queue(_retention_days integer DEFAULT 30, _max_attempts integer DEFAULT 5, _dead_letter_backoff_days integer DEFAULT 7)
 RETURNS TABLE(deleted_success integer, parked_dead_letter integer, retention_days integer, max_attempts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_deleted INTEGER := 0;
  v_parked  INTEGER := 0;
BEGIN
  -- Somente admins podem chamar via API. service_role bypassa por default.
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'acesso negado: requer admin';
  END IF;

  -- 1) Remove linhas processadas com sucesso há mais de _retention_days
  WITH d AS (
    DELETE FROM public.behavioral_profile_regen_queue
    WHERE last_error IS NULL
      AND last_processed_at IS NOT NULL
      AND last_processed_at < now() - make_interval(days => _retention_days)
    RETURNING 1
  )
  SELECT count(*)::int INTO v_deleted FROM d;

  -- 2) "Dead letter": itens que estouraram _max_attempts recebem next_run_at
  --    empurrado para longe (evita loop do cron), mas ficam visíveis na auditoria.
  WITH p AS (
    UPDATE public.behavioral_profile_regen_queue
    SET next_run_at = now() + make_interval(days => _dead_letter_backoff_days),
        updated_at  = now()
    WHERE attempts >= _max_attempts
      AND last_error IS NOT NULL
      AND next_run_at < now() + interval '1 day'
    RETURNING 1
  )
  SELECT count(*)::int INTO v_parked FROM p;

  RETURN QUERY SELECT v_deleted, v_parked, _retention_days, _max_attempts;
END;
$function$
