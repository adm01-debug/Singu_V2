-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329181351
-- nome:   drop_and_recreate_vw_suppliers_completo

DROP VIEW IF EXISTS vw_suppliers_completo;

CREATE VIEW vw_suppliers_completo AS
SELECT 
  s.id,
  s.company_id,
  s.categoria,
  s.tipo_fornecedor,
  s.ramo_atividade,
  s.grupo_economico,
  s.produtos,
  s.servicos,
  s.api_url,
  s.tem_integracao,
  s.perfil_preco,
  s.perfil_qualidade,
  s.perfil_prazo,
  s.prazo_entrega_medio,
  s.pedido_minimo,
  s.forma_pagamento,
  s.prazo_pagamento,
  s.homologado,
  s.data_homologacao,
  s.score_geral,
  s.created_at,
  s.updated_at,
  co.razao_social,
  co.nome_fantasia,
  co.nome_crm AS company_title,
  co.cnpj,
  co.status AS company_status,
  co.situacao_rf,
  co.porte_rf,
  co.capital_social,
  -- Score detalhado
  ss.score_preco,
  ss.score_prazo,
  ss.score_qualidade,
  ss.score_entrega,
  ss.classificacao,
  ss.segment_code,
  ss.trend,
  ss.total_avaliacoes,
  ss.ultima_avaliacao,
  ss.previous_score,
  ss.score_change,
  -- Homologação mais recente
  hom.homologation_id,
  hom.homologation_status,
  hom.homologation_validade,
  hom.homologation_avaliador,
  hom.homologation_data_decisao,
  -- Contato
  phone.numero AS telefone_principal,
  email.email AS email_principal,
  addr.cidade,
  addr.estado
FROM suppliers s
JOIN companies co ON co.id = s.company_id
LEFT JOIN supplier_scores ss ON ss.supplier_id = s.id
LEFT JOIN LATERAL (
  SELECT 
    sh.id AS homologation_id,
    sh.status AS homologation_status,
    sh.validade AS homologation_validade,
    u.name AS homologation_avaliador,
    sh.data_decisao AS homologation_data_decisao
  FROM supplier_homologations sh
  LEFT JOIN users u ON u.id = sh.avaliador_id
  WHERE sh.supplier_id = s.id
  ORDER BY sh.created_at DESC
  LIMIT 1
) hom ON true
LEFT JOIN LATERAL (
  SELECT cp.numero FROM company_phones cp 
  WHERE cp.company_id = co.id AND cp.is_primary = true LIMIT 1
) phone ON true
LEFT JOIN LATERAL (
  SELECT ce.email FROM company_emails ce 
  WHERE ce.company_id = co.id AND ce.is_primary = true LIMIT 1
) email ON true
LEFT JOIN LATERAL (
  SELECT ca.cidade, ca.estado FROM company_addresses ca 
  WHERE ca.company_id = co.id ORDER BY ca.is_primary DESC LIMIT 1
) addr ON true;
