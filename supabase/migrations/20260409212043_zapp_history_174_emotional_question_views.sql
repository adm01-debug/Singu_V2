-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409212043
-- nome:   zapp_history_174_emotional_question_views

CREATE OR REPLACE VIEW zapp_history.v_emotional_states AS
SELECT
  emotional_state->>'dominant' AS estado,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio,
  COUNT(*) FILTER (WHERE churn_risk IS NOT NULL) AS com_churn_risco,
  array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas_funil
FROM zapp_history.messages
WHERE emotional_state IS NOT NULL
GROUP BY emotional_state->>'dominant'
ORDER BY total_mensagens DESC;

GRANT SELECT ON zapp_history.v_emotional_states TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_question_topics AS
SELECT
  jsonb_array_elements_text(question_analysis->'topics') AS topico_pergunta,
  question_analysis->>'type' AS tipo_pergunta,
  COUNT(*) AS total_perguntas,
  COUNT(DISTINCT contact_id) AS contatos_distintos,
  AVG(lead_score)::numeric(5,2) AS score_medio
FROM zapp_history.messages
WHERE question_analysis IS NOT NULL
GROUP BY jsonb_array_elements_text(question_analysis->'topics'), question_analysis->>'type'
ORDER BY total_perguntas DESC;

GRANT SELECT ON zapp_history.v_question_topics TO authenticated;
