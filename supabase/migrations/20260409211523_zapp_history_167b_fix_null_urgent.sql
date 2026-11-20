-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409211523
-- nome:   zapp_history_167b_fix_null_urgent

CREATE OR REPLACE FUNCTION zapp_history.calculate_priority_quadrant(p_lead_score INT, p_sentiment TEXT, p_churn_risk TEXT, p_funnel_stage TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_urgent BOOLEAN;
  v_important BOOLEAN;
  v_quadrant TEXT;
  v_action TEXT;
BEGIN
  v_urgent := COALESCE(p_sentiment = 'urgent', FALSE)
           OR COALESCE(p_churn_risk IN ('alto','critico'), FALSE)
           OR COALESCE(p_funnel_stage IN ('negociacao','fechamento'), FALSE);
  v_important := COALESCE(p_lead_score, 0) >= 60;

  IF v_urgent AND v_important THEN
    v_quadrant := 'Q1_FAZER_AGORA';
    v_action := '🔥 Atender imediatamente. Lead alto valor + urgente.';
  ELSIF NOT v_urgent AND v_important THEN
    v_quadrant := 'Q2_AGENDAR';
    v_action := '📅 Lead importante mas não urgente. Agendar follow-up estratégico.';
  ELSIF v_urgent AND NOT v_important THEN
    v_quadrant := 'Q3_DELEGAR';
    v_action := '⚡ Urgente mas baixo valor. Delegar para SDR ou bot.';
  ELSE
    v_quadrant := 'Q4_AUTOMACAO';
    v_action := '🤖 Baixo valor + sem urgência. Resposta automática ou catálogo.';
  END IF;

  RETURN jsonb_build_object(
    'quadrant', v_quadrant,
    'urgent', v_urgent,
    'important', v_important,
    'action', v_action
  );
END;
$fn$;

-- Re-backfill
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, lead_score, nlp_sentiment, churn_risk, funnel_stage
           FROM zapp_history.messages WHERE whatsapp_message_id LIKE '\_v166\_%' ESCAPE '\'
  LOOP
    UPDATE zapp_history.messages
    SET priority_quadrant = (zapp_history.calculate_priority_quadrant(
      r.lead_score, r.nlp_sentiment, r.churn_risk->>'risk', r.funnel_stage
    ))->>'quadrant'
    WHERE id = r.id;
  END LOOP;
END $$;

SELECT whatsapp_message_id, lead_score, nlp_sentiment, funnel_stage, priority_quadrant
FROM zapp_history.messages
WHERE whatsapp_message_id LIKE '\_v166\_%' ESCAPE '\'
ORDER BY whatsapp_message_id;
