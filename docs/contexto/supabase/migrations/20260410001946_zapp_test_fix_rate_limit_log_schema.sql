CREATE OR REPLACE FUNCTION zapp_history.trg_connector_log_rate_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','public','pg_temp'
AS $fn$
DECLARE v_count INTEGER;
BEGIN
  IF NEW.direction <> 'inbound' OR NEW.whatsapp_number IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.connector_log
  WHERE whatsapp_number = NEW.whatsapp_number
    AND direction = 'inbound'
    AND created_at > NOW() - INTERVAL '60 seconds';

  IF v_count > 10 THEN
    NEW.processed := TRUE;
    NEW.bitrix_response := COALESCE(NEW.bitrix_response, '{}'::jsonb) ||
      jsonb_build_object('rate_limited', true, 'msgs_60s', v_count, 'blocked_at', NOW());
    -- gravar sem entity_id (coluna não aceita NULL, então usa um UUID gerado)
    INSERT INTO zapp_history.async_request_log (request_kind, entity_type, entity_id, payload_preview, status)
    VALUES ('rate_limit','connector_log',gen_random_uuid(),'flood:'||NEW.whatsapp_number||'@'||v_count,'blocked');
  END IF;

  RETURN NEW;
END;
$fn$;
