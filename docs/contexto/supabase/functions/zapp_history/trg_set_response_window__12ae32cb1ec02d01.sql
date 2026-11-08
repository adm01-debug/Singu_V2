CREATE OR REPLACE FUNCTION zapp_history.trg_set_response_window()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE v_window JSONB;
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;
  IF NEW.direction <> 'inbound' THEN RETURN NEW; END IF;

  v_window := zapp_history.suggest_response_window(
    NEW.created_at, NEW.lead_score, NEW.churn_risk->>'risk', NEW.nlp_sentiment
  );

  UPDATE zapp_history.messages
  SET suggested_response_at = (v_window->>'target_at')::TIMESTAMPTZ,
      suggested_response_label = v_window->>'label'
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$
