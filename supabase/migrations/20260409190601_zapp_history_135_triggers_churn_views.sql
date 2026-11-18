-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409190601
-- nome:   zapp_history_135_triggers_churn_views

CREATE OR REPLACE VIEW zapp_history.v_buying_triggers AS
SELECT
  unnest(buying_triggers) AS trigger,
  COUNT(*) AS total_ocorrencias,
  COUNT(DISTINCT contact_id) AS contatos_distintos,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio,
  AVG(budget_detected)::numeric(12,2) AS budget_medio,
  COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS chegou_no_fechamento,
  COUNT(*) FILTER (WHERE funnel_stage = 'proposta') AS na_proposta
FROM zapp_history.messages
WHERE buying_triggers IS NOT NULL AND array_length(buying_triggers, 1) > 0
GROUP BY unnest(buying_triggers)
ORDER BY total_ocorrencias DESC;

GRANT SELECT ON zapp_history.v_buying_triggers TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_churn_alerts AS
SELECT
  m.id AS message_id,
  m.created_at AS detectado_em,
  ct.full_name AS contato,
  comp.razao_social AS empresa,
  conv.remote_jid AS whatsapp,
  m.churn_risk->>'risk' AS risco,
  (m.churn_risk->>'score')::INT AS score_risco,
  m.churn_risk->'signals' AS sinais,
  LEFT(m.content, 300) AS mensagem,
  m.nlp_sentiment AS sentimento,
  m.lead_score
FROM zapp_history.messages m
JOIN public.contacts ct ON ct.id = m.contact_id
JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
LEFT JOIN public.companies comp ON comp.id = m.company_id
WHERE m.churn_risk IS NOT NULL
  AND (m.churn_risk->>'risk') IN ('alto','critico')
ORDER BY (m.churn_risk->>'score')::INT DESC, m.created_at DESC;

GRANT SELECT ON zapp_history.v_churn_alerts TO authenticated;
