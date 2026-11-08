CREATE VIEW vw_supplier_homologation_control AS
SELECT 
  co.nome_crm AS fornecedor,
  co.cnpj,
  s.homologado,
  sh.status AS ultimo_status,
  sh.data_solicitacao,
  sh.data_decisao,
  sh.validade,
  CASE 
    WHEN sh.validade IS NULL THEN NULL
    WHEN sh.validade < CURRENT_DATE THEN 0 - (CURRENT_DATE - sh.validade)
    ELSE sh.validade - CURRENT_DATE
  END AS dias_para_vencer,
  CASE
    WHEN sh.status IS NULL THEN 'NUNCA_SOLICITADA'
    WHEN sh.status = 'homologado' AND sh.validade < CURRENT_DATE THEN 'VENCIDA'
    WHEN sh.status = 'homologado' AND sh.validade BETWEEN CURRENT_DATE AND CURRENT_DATE + 30 THEN 'VENCENDO_EM_BREVE'
    WHEN sh.status = 'homologado' THEN 'VIGENTE'
    ELSE sh.status::text
  END AS situacao,
  u.name AS avaliador,
  sh.motivo_reprovacao,
  sh.observacoes,
  sh.criterios_checados,
  s.id AS supplier_id,
  s.company_id,
  sh.id AS homologation_id
FROM suppliers s
JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL
LEFT JOIN LATERAL (
  SELECT * FROM supplier_homologations sh2
  WHERE sh2.supplier_id = s.id
  ORDER BY sh2.created_at DESC LIMIT 1
) sh ON true
LEFT JOIN users u ON u.id = sh.avaliador_id
ORDER BY 
  CASE 
    WHEN sh.status IS NULL THEN 0
    WHEN sh.status = 'pendente' THEN 1
    WHEN sh.status = 'em_analise' THEN 2
    WHEN sh.status = 'homologado' AND sh.validade < CURRENT_DATE THEN 3
    ELSE 10
  END,
  co.nome_crm;
