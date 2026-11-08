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
