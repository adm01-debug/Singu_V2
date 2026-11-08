CREATE OR REPLACE FUNCTION zapp_history.trg_sync_summary_to_interaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
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
$function$
