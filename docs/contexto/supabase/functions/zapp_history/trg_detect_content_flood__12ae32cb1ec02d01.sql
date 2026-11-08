CREATE OR REPLACE FUNCTION zapp_history.trg_detect_content_flood()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE v_count INTEGER;
BEGIN
  IF NEW.direction <> 'inbound' OR NEW.content IS NULL OR length(NEW.content) < 3 THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM zapp_history.messages
  WHERE contact_id = NEW.contact_id
    AND direction = 'inbound'
    AND content = NEW.content
    AND created_at > NOW() - INTERVAL '5 minutes'
    AND id <> NEW.id;

  IF v_count >= 2 THEN
    NEW.quarantined := TRUE;
    NEW.credibility := jsonb_build_object(
      'level','critica_spam',
      'score',0,
      'flags',jsonb_build_array('content_flood','repetition_'||(v_count+1)||'x_5min')
    );
  END IF;

  RETURN NEW;
END;
$function$
