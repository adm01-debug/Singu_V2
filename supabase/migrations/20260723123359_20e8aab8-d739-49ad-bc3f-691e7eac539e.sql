-- Rodada 39/10 — Onda G Bucket B (lote 5): DEFINER → INVOKER
-- Alvos: cleanup_behavioral_regen_queue, execute_readonly_query

-- 1) cleanup_behavioral_regen_queue: mantém guard de admin, agora executa como o chamador.
CREATE OR REPLACE FUNCTION public.cleanup_behavioral_regen_queue(
  _retention_days integer DEFAULT 30,
  _max_attempts integer DEFAULT 5,
  _dead_letter_backoff_days integer DEFAULT 7
)
RETURNS TABLE(deleted_success integer, parked_dead_letter integer, retention_days integer, max_attempts integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted INTEGER := 0;
  v_parked  INTEGER := 0;
BEGIN
  -- Requer admin autenticado. service_role/postgres bypassam RLS naturalmente.
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'acesso negado: requer autenticação';
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'acesso negado: requer admin';
  END IF;

  WITH d AS (
    DELETE FROM public.behavioral_profile_regen_queue
    WHERE last_error IS NULL
      AND last_processed_at IS NOT NULL
      AND last_processed_at < now() - make_interval(days => _retention_days)
    RETURNING 1
  )
  SELECT count(*)::int INTO v_deleted FROM d;

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
$function$;

-- 2) execute_readonly_query: com INVOKER, RLS do chamador é aplicada (mais seguro).
CREATE OR REPLACE FUNCTION public.execute_readonly_query(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result json;
  upper_query text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'acesso negado: requer autenticação';
  END IF;
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'acesso negado: requer admin';
  END IF;

  upper_query := upper(trim(query_text));

  IF NOT (upper_query LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  IF upper_query ~ '(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY)\s' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  IF upper_query ~ '(auth\.|pg_|information_schema|supabase_)' THEN
    RAISE EXCEPTION 'Access to system schemas is not allowed';
  END IF;

  EXECUTE 'SELECT coalesce(json_agg(row_to_json(t)), ''[]''::json) FROM (' || query_text || ') t'
    INTO result;

  RETURN result;
END;
$function$;