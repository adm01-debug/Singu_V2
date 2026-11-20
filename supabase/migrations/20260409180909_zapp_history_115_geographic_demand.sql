-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409180909
-- nome:   zapp_history_115_geographic_demand

CREATE OR REPLACE VIEW zapp_history.v_demanda_geografica AS
SELECT
  COALESCE(location_extracted->>'state', 'nao_identificado') AS uf,
  COALESCE(location_extracted->>'region', 'nao_identificado') AS regiao,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
  COUNT(*) FILTER (WHERE lead_score >= 60 AND lead_score < 80) AS leads_warm,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio,
  SUM(budget_detected)::numeric(14,2) AS budget_total,
  AVG(budget_detected)::numeric(12,2) AS ticket_medio,
  COUNT(*) FILTER (WHERE nlp_structured_order ? 'cnpj') AS leads_b2b,
  array_agg(DISTINCT location_extracted->>'city') FILTER (WHERE location_extracted->>'city' IS NOT NULL) AS cidades_atendidas
FROM zapp_history.messages
WHERE nlp_processed_at IS NOT NULL
  AND location_extracted IS NOT NULL
GROUP BY location_extracted->>'state', location_extracted->>'region'
ORDER BY leads_hot DESC, total_mensagens DESC;

GRANT SELECT ON zapp_history.v_demanda_geografica TO authenticated;

-- View por cidade
CREATE OR REPLACE VIEW zapp_history.v_demanda_por_cidade AS
SELECT
  location_extracted->>'city' AS cidade,
  location_extracted->>'state' AS uf,
  (location_extracted->>'is_capital')::BOOLEAN AS capital,
  COUNT(*) AS total_pedidos,
  COUNT(DISTINCT contact_id) AS contatos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  SUM(budget_detected)::numeric(14,2) AS budget_total
FROM zapp_history.messages
WHERE location_extracted->>'city' IS NOT NULL
GROUP BY location_extracted->>'city', location_extracted->>'state', location_extracted->>'is_capital'
ORDER BY total_pedidos DESC;

GRANT SELECT ON zapp_history.v_demanda_por_cidade TO authenticated;
