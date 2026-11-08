CREATE OR REPLACE FUNCTION zapp_history.trg_connector_log_dedup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_msg_id TEXT;
  v_exists INTEGER;
BEGIN
  v_msg_id := NEW.bitrix_response->'payload'->'data'->'key'->>'id';
  IF v_msg_id IS NULL THEN
    v_msg_id := NEW.bitrix_response->>'message_id';
  END IF;

  IF v_msg_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_exists
    FROM public.connector_log
    WHERE (bitrix_response->'payload'->'data'->'key'->>'id' = v_msg_id
           OR bitrix_response->>'message_id' = v_msg_id)
      AND direction = NEW.direction
      AND whatsapp_number = NEW.whatsapp_number
      AND created_at > NOW() - INTERVAL '1 hour';

    IF v_exists > 0 THEN
      NEW.processed := TRUE;
      NEW.bitrix_response := COALESCE(NEW.bitrix_response, '{}'::jsonb) ||
        jsonb_build_object('duplicate_of', v_msg_id, 'dedup_at', NOW());
      RETURN NEW;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
