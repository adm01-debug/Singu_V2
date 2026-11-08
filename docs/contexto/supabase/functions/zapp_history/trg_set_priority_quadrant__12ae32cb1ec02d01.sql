CREATE OR REPLACE FUNCTION zapp_history.trg_set_priority_quadrant()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_score INT;
  v_quadrant TEXT;
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;

  -- Lê lead_score atualizado do banco (já gravado pelo trg_lead_score_calc)
  SELECT lead_score INTO v_score FROM zapp_history.messages WHERE id = NEW.id;

  v_quadrant := (zapp_history.calculate_priority_quadrant(
    v_score,
    NEW.nlp_sentiment,
    NEW.churn_risk->>'risk',
    NEW.funnel_stage
  ))->>'quadrant';

  UPDATE zapp_history.messages SET priority_quadrant = v_quadrant WHERE id = NEW.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$
