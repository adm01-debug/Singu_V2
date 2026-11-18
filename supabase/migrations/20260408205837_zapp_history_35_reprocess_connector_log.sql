-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408205837
-- nome:   zapp_history_35_reprocess_connector_log

-- ============================================================================
-- MELHORIA 35: RPC pra reprocessar connector_log existente (backfill)
-- Útil quando o trigger é atualizado: forçar replay sem perder histórico
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.reprocess_connector_log(
  p_only_failed BOOLEAN DEFAULT FALSE,
  p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (reprocessed_count INTEGER, errors_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  r RECORD;
  v_reprocessed INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.connector_log
    WHERE (p_only_failed = FALSE OR parse_error IS NOT NULL)
      AND direction IN ('inbound','outbound')
    ORDER BY created_at ASC
    LIMIT p_limit
  LOOP
    -- Reset estado
    UPDATE public.connector_log
    SET processed = FALSE, parse_error = NULL, zapp_message_id = NULL
    WHERE id = r.id;

    -- Re-trigger via UPDATE simbólico (que não muda nada mas dispara o AFTER UPDATE...
    -- ESPERA: o trigger é AFTER INSERT, não AFTER UPDATE. Solução: rechamar a função diretamente
    -- via PERFORM zapp_history.parse_connector_log_to_messages() não é possível porque é trigger fn
    -- Alternativa: re-inserir via DELETE + INSERT
    -- Mas isso quebra IDs... Melhor: criar trigger AFTER UPDATE também

    v_reprocessed := v_reprocessed + 1;
  END LOOP;

  RETURN QUERY SELECT v_reprocessed, v_errors;
END;
$fn$;

-- Alternativa correta: trigger AFTER INSERT OR UPDATE para permitir replay
DROP TRIGGER IF EXISTS trg_parse_connector_log ON public.connector_log;
CREATE TRIGGER trg_parse_connector_log
  AFTER INSERT OR UPDATE OF processed ON public.connector_log
  FOR EACH ROW
  WHEN (NEW.processed = FALSE)
  EXECUTE FUNCTION zapp_history.parse_connector_log_to_messages();

COMMENT ON FUNCTION zapp_history.reprocess_connector_log IS
  'Reprocessa logs do connector. Use p_only_failed=true para retry só de erros, ou false pra replay completo.';
