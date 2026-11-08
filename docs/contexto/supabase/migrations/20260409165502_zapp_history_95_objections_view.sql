CREATE OR REPLACE VIEW zapp_history.v_objecoes_recorrentes AS
SELECT
  unnest(objections) AS objecao,
  COUNT(*) AS total_ocorrencias,
  COUNT(DISTINCT contact_id) AS contatos_distintos,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio,
  COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS apareceu_no_fechamento,
  COUNT(*) FILTER (WHERE funnel_stage = 'negociacao') AS apareceu_na_negociacao,
  array_agg(DISTINCT funnel_stage) AS etapas_observadas
FROM zapp_history.messages
WHERE objections IS NOT NULL AND array_length(objections, 1) > 0
GROUP BY unnest(objections)
ORDER BY total_ocorrencias DESC;

GRANT SELECT ON zapp_history.v_objecoes_recorrentes TO authenticated;

COMMENT ON VIEW zapp_history.v_objecoes_recorrentes IS
'Top objeções extraídas automaticamente das conversas. Mostra qual objeção aparece mais e em qual etapa do funil.';
