-- Função pra detectar e processar mensagens zombie (>1h sem nlp_processed_at)
CREATE OR REPLACE FUNCTION zapp_history.gc_zombie_messages()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','public','pg_temp'
AS $fn$
DECLARE v_count INTEGER := 0;
BEGIN
  UPDATE zapp_history.messages
  SET nlp_processed_at = NOW(),
      primary_intent = 'nao_classificado',
      nlp_sentiment = 'neutral',
      lead_score = 0,
      funnel_stage = 'descoberta',
      language_info = jsonb_build_object('lang','unknown','processed_by_gc',true),
      credibility = jsonb_build_object('level','alta','score',100,'flags','["gc_recovered"]'::jsonb),
      bant_score = jsonb_build_object('classification','lead_frio','bant_total',10,'processed_by_gc',true)
  WHERE nlp_processed_at IS NULL
    AND created_at < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, payload_preview, status
    ) VALUES (
      'gc_zombie_messages','messages',NULL,
      'Recovered ' || v_count || ' zombies','gc_run'
    );
  END IF;

  RETURN v_count;
END;
$fn$;

-- Agenda cron de 15 em 15 minutos
SELECT cron.schedule(
  'zapp-gc-zombie-messages',
  '*/15 * * * *',
  $$SELECT zapp_history.gc_zombie_messages();$$
);
