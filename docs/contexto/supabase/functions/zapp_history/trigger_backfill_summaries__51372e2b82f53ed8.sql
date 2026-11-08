CREATE OR REPLACE FUNCTION zapp_history.trigger_backfill_summaries(p_start_date date, p_end_date date DEFAULT (CURRENT_DATE - 1), p_contact_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(queued_date date, http_request_id bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  d DATE;
  rid BIGINT;
  v_payload JSONB;
BEGIN
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'start_date (%) must be <= end_date (%)', p_start_date, p_end_date;
  END IF;

  IF (p_end_date - p_start_date) > 90 THEN
    RAISE EXCEPTION 'backfill window too large (max 90 days). Requested: % days', p_end_date - p_start_date;
  END IF;

  FOR d IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date LOOP
    v_payload := jsonb_build_object('date', d::text, 'is_backfill', true);
    IF p_contact_id IS NOT NULL THEN
      v_payload := v_payload || jsonb_build_object('contact_id', p_contact_id);
    END IF;

    rid := zapp_history.invoke_edge_function('generate-daily-summary', v_payload);
    queued_date := d;
    http_request_id := rid;
    RETURN NEXT;

    -- Pausa de 2s entre invocações pra evitar rate limit OpenAI
    PERFORM pg_sleep(2);
  END LOOP;
END;
$function$
