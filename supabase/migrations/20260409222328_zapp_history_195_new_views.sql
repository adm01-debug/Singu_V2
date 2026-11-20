-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409222328
-- nome:   zapp_history_195_new_views

CREATE OR REPLACE VIEW zapp_history.v_company_sizes AS
SELECT
  company_size->>'size' AS porte,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  AVG(budget_detected)::numeric(14,2) AS ticket_medio,
  AVG((nlp_structured_order->>'quantity')::INT)::INT AS qty_media,
  COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot
FROM zapp_history.messages
WHERE company_size IS NOT NULL
GROUP BY company_size->>'size'
ORDER BY
  CASE company_size->>'size'
    WHEN 'enterprise' THEN 1 WHEN 'grande' THEN 2 WHEN 'media' THEN 3 WHEN 'pequena' THEN 4
  END;

GRANT SELECT ON zapp_history.v_company_sizes TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_seasonality_demand AS
SELECT
  unnest(seasonality) AS sazonalidade,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  SUM((nlp_structured_order->>'quantity')::INT) AS qty_total,
  SUM(budget_detected)::numeric(14,2) AS valor_total
FROM zapp_history.messages
WHERE seasonality IS NOT NULL
GROUP BY unnest(seasonality)
ORDER BY total_mensagens DESC;

GRANT SELECT ON zapp_history.v_seasonality_demand TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_relationship_funnel AS
SELECT
  relationship_status->>'status' AS status,
  COUNT(*) AS total_mensagens,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  AVG((relationship_status->>'total_msgs')::INT)::INT AS msgs_medias_por_contato,
  COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS fechamentos
FROM zapp_history.messages
WHERE relationship_status IS NOT NULL
GROUP BY relationship_status->>'status'
ORDER BY
  CASE relationship_status->>'status'
    WHEN 'recorrente_alto' THEN 1
    WHEN 'recorrente' THEN 2
    WHEN 'em_desenvolvimento' THEN 3
    WHEN 'iniciante' THEN 4
    WHEN 'novo' THEN 5
    WHEN 'retornante' THEN 6
    ELSE 7
  END;

GRANT SELECT ON zapp_history.v_relationship_funnel TO authenticated;
