-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409165502
-- nome:   zapp_history_95_objections_view

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
