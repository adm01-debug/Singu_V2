CREATE OR REPLACE FUNCTION zapp_history.trg_supplement_urgency()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE v_urgency TEXT;
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;

  v_urgency := zapp_history.detect_urgency_text(NEW.content);
  IF v_urgency IS NOT NULL THEN
    NEW.delivery_preference := COALESCE(NEW.delivery_preference, '{}'::jsonb) ||
      jsonb_build_object('urgency', v_urgency, 'source', 'text_pattern');
  END IF;

  RETURN NEW;
END;
$function$
