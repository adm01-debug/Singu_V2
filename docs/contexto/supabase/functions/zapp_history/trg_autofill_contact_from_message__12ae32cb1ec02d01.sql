CREATE OR REPLACE FUNCTION zapp_history.trg_autofill_contact_from_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
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
$function$
