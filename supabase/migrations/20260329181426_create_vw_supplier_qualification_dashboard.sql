-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329181426
-- nome:   create_vw_supplier_qualification_dashboard

CREATE VIEW vw_supplier_qualification_dashboard AS
SELECT
  -- Totais gerais
  COUNT(*) AS total_fornecedores,
  COUNT(*) FILTER (WHERE s.homologado = true) AS total_homologados,
  COUNT(*) FILTER (WHERE s.homologado = false) AS total_nao_homologados,
  ROUND(100.0 * COUNT(*) FILTER (WHERE s.homologado = true) / NULLIF(COUNT(*), 0), 1) AS pct_homologados,
  -- Por segmento de score
  COUNT(*) FILTER (WHERE ss.segment_code = 'excelente') AS qtd_excelente,
  COUNT(*) FILTER (WHERE ss.segment_code = 'bom') AS qtd_bom,
  COUNT(*) FILTER (WHERE ss.segment_code = 'regular') AS qtd_regular,
  COUNT(*) FILTER (WHERE ss.segment_code = 'insuficiente') AS qtd_insuficiente,
  COUNT(*) FILTER (WHERE ss.segment_code = 'critico') AS qtd_critico,
  COUNT(*) FILTER (WHERE ss.supplier_id IS NULL) AS qtd_sem_avaliacao,
  -- Score médio geral
  ROUND(AVG(ss.score_geral), 2) AS score_medio_geral,
  -- Tendência
  COUNT(*) FILTER (WHERE ss.trend = 'melhorando') AS qtd_melhorando,
  COUNT(*) FILTER (WHERE ss.trend = 'estavel') AS qtd_estavel,
  COUNT(*) FILTER (WHERE ss.trend = 'piorando') AS qtd_piorando,
  -- Homologação
  COUNT(*) FILTER (WHERE hom.status = 'pendente') AS homologacoes_pendentes,
  COUNT(*) FILTER (WHERE hom.status = 'em_analise') AS homologacoes_em_analise,
  COUNT(*) FILTER (WHERE hom.validade < CURRENT_DATE) AS homologacoes_vencidas,
  COUNT(*) FILTER (WHERE hom.validade BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) AS homologacoes_vencendo_30d,
  -- Avaliações
  COALESCE(SUM(ss.total_avaliacoes), 0) AS total_avaliacoes_realizadas,
  (SELECT COUNT(*) FROM supplier_evaluations WHERE data_avaliacao >= CURRENT_DATE - 30) AS avaliacoes_ultimos_30d
FROM suppliers s
JOIN companies c ON c.id = s.company_id AND c.deleted_at IS NULL
LEFT JOIN supplier_scores ss ON ss.supplier_id = s.id
LEFT JOIN LATERAL (
  SELECT sh.status, sh.validade
  FROM supplier_homologations sh
  WHERE sh.supplier_id = s.id
  ORDER BY sh.created_at DESC LIMIT 1
) hom ON true;
