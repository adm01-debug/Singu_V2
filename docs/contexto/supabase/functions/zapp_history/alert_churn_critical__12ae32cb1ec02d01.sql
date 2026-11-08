CREATE OR REPLACE FUNCTION zapp_history.alert_churn_critical()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
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
$function$
