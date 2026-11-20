-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409165452
-- nome:   zapp_history_94_funil_vendas_view

CREATE OR REPLACE VIEW zapp_history.v_funil_vendas AS
WITH stages AS (
  SELECT 'descoberta'  AS stage, 1 AS ordem UNION ALL
  SELECT 'interesse',     2 UNION ALL
  SELECT 'cotacao',       3 UNION ALL
  SELECT 'proposta',      4 UNION ALL
  SELECT 'negociacao',    5 UNION ALL
  SELECT 'fechamento',    6
)
SELECT
  s.stage AS etapa,
  s.ordem,
  COUNT(m.id) AS total_mensagens,
  COUNT(DISTINCT m.contact_id) AS contatos_unicos,
  AVG(m.lead_score)::numeric(5,2) AS lead_score_medio,
  SUM(m.budget_detected)::numeric(14,2) AS budget_total,
  COUNT(*) FILTER (WHERE m.nlp_sentiment = 'urgent') AS urgentes,
  COUNT(*) FILTER (WHERE m.objections IS NOT NULL) AS com_objecoes
FROM stages s
LEFT JOIN zapp_history.messages m ON m.funnel_stage = s.stage
GROUP BY s.stage, s.ordem
ORDER BY s.ordem;

GRANT SELECT ON zapp_history.v_funil_vendas TO authenticated;
