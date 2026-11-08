CREATE OR REPLACE FUNCTION zapp_history.trg_set_technical_interest()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;
  NEW.technical_interest := zapp_history.detect_technical_interest(NEW.content);
  RETURN NEW;
END;
$function$
