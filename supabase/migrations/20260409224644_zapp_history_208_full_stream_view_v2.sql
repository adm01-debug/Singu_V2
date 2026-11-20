-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409224644
-- nome:   zapp_history_208_full_stream_view_v2

CREATE OR REPLACE VIEW zapp_history.v_full_intelligence_stream AS
SELECT
  m.id AS message_id,
  m.created_at,
  ct.full_name AS contato,
  comp.razao_social AS empresa,
  m.content AS preview,
  m.lead_score,
  CASE
    WHEN m.lead_score >= 80 THEN 'HOT'
    WHEN m.lead_score >= 60 THEN 'WARM'
    WHEN m.lead_score >= 40 THEN 'LUKEWARM'
    ELSE 'COLD'
  END AS classificacao,
  m.priority_quadrant,
  m.funnel_stage,
  m.journey_stage,
  m.primary_intent,
  m.customer_type,
  m.speaker_role,
  m.disc_profile->>'profile' AS disc,
  m.company_size->>'size' AS porte,
  m.relationship_status->>'status' AS relacao,
  m.emotional_state->>'dominant' AS emocao,
  m.communication_tone->>'tone' AS tom,
  m.language_info->>'lang' AS idioma,
  m.hesitation->>'level' AS hesit,
  m.budget_sensitivity->>'sensitivity' AS sens_budget,
  m.credibility->>'level' AS credibilidade,
  m.nlp_structured_order->>'product' AS produto,
  m.nlp_structured_order->>'quantity' AS qty,
  m.budget_detected AS budget,
  m.topics,
  m.seasonality,
  m.payment_preferences,
  m.competitor_mention->>'context' AS concorrente,
  m.objections,
  m.buying_triggers,
  m.churn_risk->>'risk' AS churn,
  m.suggested_response_at AS responder_ate,
  m.quarantined
FROM zapp_history.messages m
LEFT JOIN public.contacts ct ON ct.id = m.contact_id
LEFT JOIN public.companies comp ON comp.id = m.company_id
WHERE m.direction = 'inbound' AND m.nlp_processed_at IS NOT NULL
ORDER BY m.created_at DESC;

GRANT SELECT ON zapp_history.v_full_intelligence_stream TO authenticated;
