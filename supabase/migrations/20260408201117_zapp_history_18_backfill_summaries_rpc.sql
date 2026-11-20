-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408201117
-- nome:   zapp_history_18_backfill_summaries_rpc

-- ============================================================================
-- MELHORIA 18: trigger_backfill_summaries — RPC para reprocessar dias passados
-- Agenda invocações da edge function generate-daily-summary em sequência
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.trigger_backfill_summaries(
  p_start_date DATE,
  p_end_date DATE DEFAULT CURRENT_DATE - 1,
  p_contact_id UUID DEFAULT NULL
)
RETURNS TABLE (queued_date DATE, http_request_id BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
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
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.trigger_backfill_summaries(DATE, DATE, UUID) TO authenticated;

COMMENT ON FUNCTION zapp_history.trigger_backfill_summaries IS
  'Dispara generate-daily-summary para um intervalo de datas. Útil pra backfill após deploy. Limite: 90 dias por chamada.';
