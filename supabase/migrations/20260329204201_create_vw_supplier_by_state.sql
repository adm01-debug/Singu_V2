-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329204201
-- nome:   create_vw_supplier_by_state

CREATE VIEW vw_supplier_by_state AS
SELECT 
  COALESCE(addr.estado, 'SEM ESTADO') AS estado,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE s.homologado = true) AS homologados,
  COUNT(*) FILTER (WHERE s.homologado = false) AS nao_homologados,
  ROUND(AVG(ss.score_geral), 2) AS score_medio,
  COUNT(ss.supplier_id) AS com_avaliacao
FROM suppliers s
JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL
LEFT JOIN supplier_scores ss ON ss.supplier_id = s.id
LEFT JOIN LATERAL (
  SELECT ca.estado FROM company_addresses ca WHERE ca.company_id = co.id ORDER BY ca.is_primary DESC LIMIT 1
) addr ON true
GROUP BY addr.estado
ORDER BY total DESC;
