-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409174459
-- nome:   zapp_history_106_contact_value_ranking

CREATE OR REPLACE VIEW zapp_history.v_top_contatos_potencial AS
SELECT
  ct.id AS contact_id,
  ct.full_name AS contato,
  comp.razao_social AS empresa,
  COUNT(DISTINCT m.id) AS total_mensagens,
  COUNT(DISTINCT conv.id) AS total_conversas,
  MAX(m.lead_score) AS melhor_lead_score,
  AVG(m.lead_score)::numeric(5,2) AS score_medio,
  SUM(m.budget_detected)::numeric(14,2) AS budget_total_mencionado,
  AVG(m.budget_detected)::numeric(12,2) AS ticket_medio_potencial,
  COUNT(*) FILTER (WHERE m.nlp_sentiment = 'urgent') AS msgs_urgentes,
  array_agg(DISTINCT m.nlp_structured_order->>'product') FILTER (WHERE m.nlp_structured_order->>'product' IS NOT NULL) AS produtos_interesse,
  array_agg(DISTINCT m.discovery_channel) FILTER (WHERE m.discovery_channel IS NOT NULL) AS canais,
  array_agg(DISTINCT m.funnel_stage) FILTER (WHERE m.funnel_stage IS NOT NULL) AS etapas_passadas,
  MIN(m.created_at) AS primeiro_contato,
  MAX(m.created_at) AS ultimo_contato
FROM zapp_history.messages m
JOIN zapp_history.conversations conv ON conv.id = m.conversation_id
JOIN public.contacts ct ON ct.id = m.contact_id
LEFT JOIN public.companies comp ON comp.id = m.company_id
WHERE m.nlp_processed_at IS NOT NULL
GROUP BY ct.id, ct.full_name, comp.razao_social
HAVING MAX(m.lead_score) IS NOT NULL
ORDER BY MAX(m.lead_score) DESC NULLS LAST, SUM(m.budget_detected) DESC NULLS LAST;

GRANT SELECT ON zapp_history.v_top_contatos_potencial TO authenticated;
