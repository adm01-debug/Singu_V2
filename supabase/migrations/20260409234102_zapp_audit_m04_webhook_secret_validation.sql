-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409234102
-- nome:   zapp_audit_m04_webhook_secret_validation

-- Valida se o webhook_shared_secret vem no payload (anti-injection)
-- A edge function v6 vai injetar esse campo no bitrix_response antes do insert
CREATE OR REPLACE FUNCTION zapp_history.trg_connector_log_validate_secret()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','public','pg_temp'
AS $fn$
DECLARE
  v_expected TEXT;
  v_provided TEXT;
  v_enforce BOOLEAN;
BEGIN
  -- Checa se enforcement está ativo (default OFF até edge function v6 estar em prod)
  SELECT COALESCE((SELECT value::BOOLEAN FROM zapp_history.runtime_config WHERE key='WEBHOOK_SECRET_ENFORCE'), FALSE)
  INTO v_enforce;

  IF NOT v_enforce THEN
    RETURN NEW;
  END IF;

  v_expected := zapp_history.get_runtime_secret('WEBHOOK_SHARED_SECRET');
  v_provided := NEW.bitrix_response->>'_webhook_secret';

  IF v_expected IS NULL OR v_provided IS NULL OR v_provided <> v_expected THEN
    -- Marca como rejeitada e não processa
    NEW.processed := TRUE;
    NEW.bitrix_response := COALESCE(NEW.bitrix_response, '{}'::jsonb) - '_webhook_secret' ||
      jsonb_build_object('rejected_reason','invalid_webhook_secret','rejected_at',NOW());
    INSERT INTO zapp_history.async_request_log (request_kind, entity_type, payload_preview, status)
    VALUES ('webhook_rejected','connector_log',NEW.whatsapp_number,'rejected_secret_mismatch');
    RETURN NEW;
  END IF;

  -- Remove o secret do payload pra não ficar gravado no log
  NEW.bitrix_response := NEW.bitrix_response - '_webhook_secret';
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_validate_secret_connector_log ON public.connector_log;
CREATE TRIGGER trg_validate_secret_connector_log
  BEFORE INSERT ON public.connector_log
  FOR EACH ROW
  EXECUTE FUNCTION zapp_history.trg_connector_log_validate_secret();

-- Toggle OFF por default
INSERT INTO zapp_history.runtime_config (key, value, is_secret, description)
VALUES ('WEBHOOK_SECRET_ENFORCE','false',false,'Ativa validação do webhook_shared_secret (ligar após deploy v6)')
ON CONFLICT (key) DO NOTHING;
