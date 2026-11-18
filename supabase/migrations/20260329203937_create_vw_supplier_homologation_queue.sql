-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329203937
-- nome:   create_vw_supplier_homologation_queue

CREATE VIEW vw_supplier_homologation_queue AS
SELECT 
  co.nome_crm AS fornecedor,
  co.cnpj,
  co.razao_social,
  CASE 
    WHEN co.cnpj IS NOT NULL THEN true ELSE false
  END AS tem_cnpj,
  CASE 
    WHEN EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id) THEN true ELSE false
  END AS tem_telefone,
  CASE 
    WHEN EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id) THEN true ELSE false
  END AS tem_email,
  addr.cidade,
  addr.estado,
  sh.status AS ultimo_status,
  sh.motivo_reprovacao,
  CASE
    WHEN sh.id IS NULL THEN 'NUNCA_ANALISADO'
    WHEN sh.status = 'pendente' THEN 'AGUARDANDO_ANALISE'
    WHEN sh.status = 'em_analise' THEN 'EM_ANALISE'
    WHEN sh.status = 'reprovado' THEN 'REPROVADO_PENDENTE_REVISAO'
    WHEN sh.status = 'vencido' THEN 'VENCIDO_RENOVAR'
    ELSE 'OUTRO'
  END AS acao_necessaria,
  CASE
    WHEN sh.id IS NULL THEN 1
    WHEN sh.status = 'vencido' THEN 2
    WHEN sh.status = 'pendente' THEN 3
    WHEN sh.status = 'em_analise' THEN 4
    WHEN sh.status = 'reprovado' THEN 5
    ELSE 6
  END AS prioridade_ordem,
  s.id AS supplier_id,
  s.company_id
FROM suppliers s
JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL
LEFT JOIN LATERAL (
  SELECT * FROM supplier_homologations sh2 WHERE sh2.supplier_id = s.id ORDER BY sh2.created_at DESC LIMIT 1
) sh ON true
LEFT JOIN LATERAL (
  SELECT ca.cidade, ca.estado FROM company_addresses ca WHERE ca.company_id = co.id ORDER BY ca.is_primary DESC LIMIT 1
) addr ON true
WHERE s.homologado = false
ORDER BY prioridade_ordem, co.nome_crm;
