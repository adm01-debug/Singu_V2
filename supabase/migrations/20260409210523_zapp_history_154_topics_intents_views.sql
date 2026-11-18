-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409210523
-- nome:   zapp_history_154_topics_intents_views

CREATE OR REPLACE VIEW zapp_history.v_topicos_recorrentes AS
SELECT
  unnest(topics) AS topico,
  COUNT(*) AS total_ocorrencias,
  COUNT(DISTINCT contact_id) AS contatos_distintos,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio,
  array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas_observadas
FROM zapp_history.messages
WHERE topics IS NOT NULL AND array_length(topics, 1) > 0
GROUP BY unnest(topics)
ORDER BY total_ocorrencias DESC;

GRANT SELECT ON zapp_history.v_topicos_recorrentes TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_intents_distribution AS
SELECT
  primary_intent AS intencao,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
  COUNT(*) FILTER (WHERE churn_risk IS NOT NULL) AS com_churn,
  array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas
FROM zapp_history.messages
WHERE primary_intent IS NOT NULL
GROUP BY primary_intent
ORDER BY total_mensagens DESC;

GRANT SELECT ON zapp_history.v_intents_distribution TO authenticated;
