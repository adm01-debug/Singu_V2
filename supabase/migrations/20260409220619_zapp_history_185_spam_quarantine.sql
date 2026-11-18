-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409220619
-- nome:   zapp_history_185_spam_quarantine

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS quarantined BOOLEAN DEFAULT FALSE;
ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS quarantine_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_messages_quarantined ON zapp_history.messages(quarantined) WHERE quarantined = TRUE;

CREATE OR REPLACE FUNCTION zapp_history.trg_spam_quarantine()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE v_level TEXT;
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.credibility IS NULL THEN RETURN NEW; END IF;

  v_level := NEW.credibility->>'level';
  IF v_level = 'critica_spam' THEN
    UPDATE zapp_history.messages
    SET quarantined = TRUE,
        quarantine_reason = 'Auto-quarentena: ' || (NEW.credibility->>'flags')
    WHERE id = NEW.id;

    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, payload_preview, status
    ) VALUES (
      'spam_quarantine', 'messages', NEW.id,
      LEFT('🚫 Spam detectado: ' || NEW.content, 500),
      'auto_quarantined'
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS zzz3_trg_spam_quarantine ON zapp_history.messages;
CREATE TRIGGER zzz3_trg_spam_quarantine
  AFTER UPDATE OF nlp_processed_at ON zapp_history.messages
  FOR EACH ROW
  WHEN (NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL)
  EXECUTE FUNCTION zapp_history.trg_spam_quarantine();
