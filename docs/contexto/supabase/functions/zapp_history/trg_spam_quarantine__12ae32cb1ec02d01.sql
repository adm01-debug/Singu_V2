CREATE OR REPLACE FUNCTION zapp_history.trg_spam_quarantine()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
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
$function$
