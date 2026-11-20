-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408200845
-- nome:   zapp_history_12_auto_fill_contact_id

-- ============================================================================
-- MELHORIA 12: Auto-fill contact_id/conversation_id quando só vier message_id
-- Reduz boilerplate no edge function: pode inserir só com message_id
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.trg_autofill_contact_from_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
DECLARE
  v_contact_id UUID;
  v_conversation_id UUID;
BEGIN
  -- Só preenche se algum dos dois estiver NULL
  IF NEW.contact_id IS NULL OR NEW.conversation_id IS NULL THEN
    SELECT m.contact_id, m.conversation_id
      INTO v_contact_id, v_conversation_id
    FROM zapp_history.messages m
    WHERE m.id = NEW.message_id;

    IF v_contact_id IS NULL THEN
      RAISE EXCEPTION 'message_id % not found in zapp_history.messages', NEW.message_id;
    END IF;

    NEW.contact_id := COALESCE(NEW.contact_id, v_contact_id);
    NEW.conversation_id := COALESCE(NEW.conversation_id, v_conversation_id);
  END IF;

  RETURN NEW;
END;
$fn$;

-- Aplicar nas 3 tabelas
DROP TRIGGER IF EXISTS trg_mm_autofill ON zapp_history.message_media;
CREATE TRIGGER trg_mm_autofill
  BEFORE INSERT ON zapp_history.message_media
  FOR EACH ROW EXECUTE FUNCTION zapp_history.trg_autofill_contact_from_message();

DROP TRIGGER IF EXISTS trg_ma_autofill ON zapp_history.message_audio;
CREATE TRIGGER trg_ma_autofill
  BEFORE INSERT ON zapp_history.message_audio
  FOR EACH ROW EXECUTE FUNCTION zapp_history.trg_autofill_contact_from_message();

DROP TRIGGER IF EXISTS trg_ml_autofill ON zapp_history.message_links;
CREATE TRIGGER trg_ml_autofill
  BEFORE INSERT ON zapp_history.message_links
  FOR EACH ROW EXECUTE FUNCTION zapp_history.trg_autofill_contact_from_message();
