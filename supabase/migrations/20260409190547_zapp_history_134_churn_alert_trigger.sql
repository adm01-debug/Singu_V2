-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409190547
-- nome:   zapp_history_134_churn_alert_trigger

CREATE OR REPLACE FUNCTION zapp_history.alert_churn_critical()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE
  v_phone TEXT;
  v_alert TEXT;
  v_risk TEXT;
BEGIN
  IF NEW.churn_risk IS NULL THEN RETURN NEW; END IF;
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;

  v_risk := NEW.churn_risk->>'risk';
  IF v_risk NOT IN ('alto','critico') THEN RETURN NEW; END IF;

  SELECT regexp_replace(c.remote_jid, '@.*', '') INTO v_phone
  FROM zapp_history.conversations c WHERE c.id = NEW.conversation_id;

  v_alert := format(
    '🔥 CHURN %s detectado!%s%sCliente: +%s%sScore risco: %s%sSinais: %s%s%sMensagem: %s',
    upper(v_risk), E'\n', E'\n',
    v_phone, E'\n',
    NEW.churn_risk->>'score', E'\n',
    NEW.churn_risk->'signals', E'\n', E'\n',
    LEFT(COALESCE(NEW.content,''), 200)
  );

  INSERT INTO zapp_history.async_request_log (
    request_kind, entity_type, entity_id, payload_preview, status
  ) VALUES (
    'churn_alert', 'messages', NEW.id, LEFT(v_alert, 500), 'churn_pending_action'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_churn_alert ON zapp_history.messages;
CREATE TRIGGER trg_churn_alert
  AFTER UPDATE OF nlp_processed_at ON zapp_history.messages
  FOR EACH ROW
  WHEN (NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL)
  EXECUTE FUNCTION zapp_history.alert_churn_critical();
