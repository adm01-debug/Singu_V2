-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409234113
-- nome:   zapp_audit_m05_content_flood_detector

-- Detecta quando o mesmo phone manda o mesmo texto 3+ vezes em 5 minutos
CREATE OR REPLACE FUNCTION zapp_history.trg_detect_content_flood()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','public','pg_temp'
AS $fn$
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
$fn$;

DROP TRIGGER IF EXISTS trg_content_flood ON zapp_history.messages;
CREATE TRIGGER trg_content_flood
  BEFORE INSERT ON zapp_history.messages
  FOR EACH ROW
  EXECUTE FUNCTION zapp_history.trg_detect_content_flood();
