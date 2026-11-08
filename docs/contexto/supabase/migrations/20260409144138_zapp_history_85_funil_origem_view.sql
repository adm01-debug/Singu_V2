CREATE OR REPLACE VIEW zapp_history.v_funil_origem AS
SELECT
  COALESCE(discovery_channel, 'nao_identificado') AS canal,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
  COUNT(*) FILTER (WHERE lead_score BETWEEN 60 AND 79) AS leads_warm,
  COUNT(*) FILTER (WHERE lead_score BETWEEN 40 AND 59) AS leads_lukewarm,
  COUNT(*) FILTER (WHERE lead_score < 40 OR lead_score IS NULL) AS leads_cold,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio,
  AVG(budget_detected)::numeric(12,2) AS budget_medio,
  SUM(budget_detected)::numeric(14,2) AS budget_total_detectado,
  COUNT(*) FILTER (WHERE nlp_structured_order ? 'cnpj') AS leads_b2b,
  MIN(created_at) AS primeira_msg,
  MAX(created_at) AS ultima_msg
FROM zapp_history.messages
WHERE nlp_processed_at IS NOT NULL
GROUP BY discovery_channel
ORDER BY leads_hot DESC, total_mensagens DESC;

GRANT SELECT ON zapp_history.v_funil_origem TO authenticated;

COMMENT ON VIEW zapp_history.v_funil_origem IS 'Analítico de origem dos leads por canal de descoberta. Mostra qual canal traz leads mais quentes e maior budget.';
