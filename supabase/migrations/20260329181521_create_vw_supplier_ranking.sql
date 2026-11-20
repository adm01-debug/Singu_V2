-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329181521
-- nome:   create_vw_supplier_ranking

CREATE VIEW vw_supplier_ranking AS
SELECT 
  RANK() OVER (ORDER BY ss.score_geral DESC NULLS LAST) AS ranking,
  co.nome_crm AS fornecedor,
  co.cnpj,
  s.homologado,
  ss.score_geral,
  ss.score_preco,
  ss.score_prazo,
  ss.score_qualidade,
  ss.score_entrega,
  ss.classificacao,
  ss.segment_code,
  ss.trend,
  ss.total_avaliacoes,
  ss.ultima_avaliacao,
  ss.score_change,
  sqc.color AS segment_color,
  s.id AS supplier_id,
  s.company_id
FROM suppliers s
JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL
LEFT JOIN supplier_scores ss ON ss.supplier_id = s.id
LEFT JOIN supplier_qualification_config sqc ON sqc.segment_code = ss.segment_code
ORDER BY ss.score_geral DESC NULLS LAST;
