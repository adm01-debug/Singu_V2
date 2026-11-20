-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329181336
-- nome:   drop_and_recreate_vw_suppliers

DROP VIEW IF EXISTS vw_suppliers;

CREATE VIEW vw_suppliers AS
SELECT 
  c.id,
  c.bitrix_company_id,
  c.nome_crm AS title,
  c.cnpj,
  (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id AND cp.is_primary = true LIMIT 1) AS phone,
  (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary = true LIMIT 1) AS email,
  addr.cidade,
  addr.estado,
  s.categoria,
  s.tipo_fornecedor,
  s.tem_integracao,
  s.perfil_preco,
  s.homologado,
  s.data_homologacao,
  s.score_geral,
  ss.classificacao,
  ss.segment_code,
  ss.trend,
  ss.total_avaliacoes,
  ss.ultima_avaliacao,
  hom.status AS homologation_status,
  hom.validade AS homologation_validade,
  c.created_at
FROM companies c
JOIN suppliers s ON s.company_id = c.id
LEFT JOIN supplier_scores ss ON ss.supplier_id = s.id
LEFT JOIN LATERAL (
  SELECT sh.status, sh.validade
  FROM supplier_homologations sh
  WHERE sh.supplier_id = s.id
  ORDER BY sh.created_at DESC
  LIMIT 1
) hom ON true
LEFT JOIN LATERAL (
  SELECT ca.cidade, ca.estado
  FROM company_addresses ca
  WHERE ca.company_id = c.id
  ORDER BY ca.is_primary DESC
  LIMIT 1
) addr ON true
WHERE c.deleted_at IS NULL AND c.is_supplier = true;
