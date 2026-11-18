-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408200830
-- nome:   zapp_history_11_auto_sync_summary_to_interaction

-- ============================================================================
-- MELHORIA 11: Trigger AFTER INSERT em conversation_daily_summaries
-- Sincroniza automaticamente para public.interactions sem precisar de cron
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.trg_sync_summary_to_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
BEGIN
  -- Apenas sincroniza se ainda não foi sincronizado E se tem conteúdo de IA
  IF NEW.synced_to_interactions = FALSE AND NEW.summary_text IS NOT NULL THEN
    BEGIN
      PERFORM zapp_history.sync_summary_to_interaction(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      -- Sync falhou — registra erro mas não bloqueia o insert
      UPDATE zapp_history.conversation_daily_summaries
      SET sync_error = SQLERRM
      WHERE id = NEW.id;
    END;
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_auto_sync_summary ON zapp_history.conversation_daily_summaries;
CREATE TRIGGER trg_auto_sync_summary
  AFTER INSERT OR UPDATE OF summary_text ON zapp_history.conversation_daily_summaries
  FOR EACH ROW EXECUTE FUNCTION zapp_history.trg_sync_summary_to_interaction();

COMMENT ON TRIGGER trg_auto_sync_summary ON zapp_history.conversation_daily_summaries IS
  'Sincroniza automaticamente o sumário diário para public.interactions assim que summary_text é populado. Cron de retry continua existindo como fallback.';
