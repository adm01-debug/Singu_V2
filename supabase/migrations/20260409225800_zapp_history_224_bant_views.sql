-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409225800
-- nome:   zapp_history_224_bant_views

CREATE OR REPLACE VIEW zapp_history.v_bant_distribution AS
SELECT
  bant_score->>'classification' AS classificacao,
  COUNT(*) AS total,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG((bant_score->>'bant_total')::INT)::numeric(5,2) AS score_bant_medio,
  AVG((bant_score->>'budget')::INT)::numeric(5,2) AS budget_medio,
  AVG((bant_score->>'authority')::INT)::numeric(5,2) AS authority_medio,
  AVG((bant_score->>'need')::INT)::numeric(5,2) AS need_medio,
  AVG((bant_score->>'timeline')::INT)::numeric(5,2) AS timeline_medio,
  COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS fechou
FROM zapp_history.messages
WHERE bant_score IS NOT NULL
GROUP BY bant_score->>'classification'
ORDER BY
  CASE bant_score->>'classification'
    WHEN 'SQL_sales_qualified' THEN 1
    WHEN 'MQL_marketing_qualified' THEN 2
    WHEN 'lead_aquecendo' THEN 3
    WHEN 'lead_frio' THEN 4
    WHEN 'nao_qualificado' THEN 5
  END;

GRANT SELECT ON zapp_history.v_bant_distribution TO authenticated;

CREATE OR REPLACE VIEW zapp_history.v_authority_funnel AS
SELECT
  decision_authority->>'level' AS nivel_autoridade,
  COUNT(*) AS total,
  COUNT(DISTINCT contact_id) AS contatos_unicos,
  AVG(lead_score)::numeric(5,2) AS score_medio,
  COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS fechou,
  ROUND(100.0 * COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') / NULLIF(COUNT(*),0), 2) AS taxa_fechamento_pct
FROM zapp_history.messages
WHERE decision_authority IS NOT NULL
GROUP BY decision_authority->>'level'
ORDER BY
  CASE decision_authority->>'level'
    WHEN 'total' THEN 1 WHEN 'parcial' THEN 2 WHEN 'compartilhada' THEN 3 WHEN 'nenhuma' THEN 4
  END;

GRANT SELECT ON zapp_history.v_authority_funnel TO authenticated;
