-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409234045
-- nome:   zapp_audit_m03_dedup_evolution_msg_id

-- Extrai evolution_message_id do bitrix_response e dedupa duplicatas antes do parser
CREATE OR REPLACE FUNCTION zapp_history.trg_connector_log_dedup()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','public','pg_temp'
AS $fn$
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
$fn$;

DROP TRIGGER IF EXISTS trg_dedup_connector_log ON public.connector_log;
CREATE TRIGGER trg_dedup_connector_log
  BEFORE INSERT ON public.connector_log
  FOR EACH ROW
  EXECUTE FUNCTION zapp_history.trg_connector_log_dedup();
