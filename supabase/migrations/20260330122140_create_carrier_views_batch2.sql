-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330122140
-- nome:   create_carrier_views_batch2

-- Passo 33: vw_carrier_homologation_control
CREATE VIEW vw_carrier_homologation_control AS
SELECT co.nome_crm AS transportadora, co.cnpj, ca.homologado,
  ch.status AS ultimo_status,
  ch.data_solicitacao, ch.data_decisao, ch.validade,
  CASE
    WHEN ch.validade IS NULL THEN NULL
    WHEN ch.validade < CURRENT_DATE THEN 0 - (CURRENT_DATE - ch.validade)
    ELSE ch.validade - CURRENT_DATE
  END AS dias_para_vencer,
  CASE
    WHEN ch.status IS NULL THEN 'NUNCA_SOLICITADA'
    WHEN ch.status = 'homologado' AND ch.validade < CURRENT_DATE THEN 'VENCIDA'
    WHEN ch.status = 'homologado' AND ch.validade >= CURRENT_DATE AND ch.validade <= CURRENT_DATE + 30 THEN 'VENCENDO_EM_BREVE'
    WHEN ch.status = 'homologado' THEN 'VIGENTE'
    ELSE ch.status::text
  END AS situacao,
  u.name AS avaliador,
  ch.motivo_reprovacao, ch.observacoes, ch.criterios_checados,
  ca.id AS carrier_id, ca.company_id, ch.id AS homologation_id
FROM carriers ca
  JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
  LEFT JOIN LATERAL (
    SELECT ch2.* FROM carrier_homologations ch2
    WHERE ch2.carrier_id = ca.id ORDER BY ch2.created_at DESC LIMIT 1
  ) ch ON true
  LEFT JOIN users u ON u.id = ch.avaliador_id
ORDER BY (
  CASE
    WHEN ch.status IS NULL THEN 0
    WHEN ch.status = 'pendente' THEN 1
    WHEN ch.status = 'em_analise' THEN 2
    WHEN ch.status = 'homologado' AND ch.validade < CURRENT_DATE THEN 3
    ELSE 10
  END), co.nome_crm;

-- Passo 34: vw_carrier_homologation_queue
CREATE VIEW vw_carrier_homologation_queue AS
SELECT co.nome_crm AS transportadora, co.cnpj, co.razao_social,
  CASE WHEN co.cnpj IS NOT NULL THEN true ELSE false END AS tem_cnpj,
  CASE WHEN EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id) THEN true ELSE false END AS tem_telefone,
  CASE WHEN EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id) THEN true ELSE false END AS tem_email,
  addr.cidade, addr.estado,
  ch.status AS ultimo_status,
  ch.motivo_reprovacao,
  CASE
    WHEN ch.id IS NULL THEN 'NUNCA_ANALISADO'
    WHEN ch.status = 'pendente' THEN 'AGUARDANDO_ANALISE'
    WHEN ch.status = 'em_analise' THEN 'EM_ANALISE'
    WHEN ch.status = 'reprovado' THEN 'REPROVADO_PENDENTE_REVISAO'
    WHEN ch.status = 'vencido' THEN 'VENCIDO_RENOVAR'
    ELSE 'OUTRO'
  END AS acao_necessaria,
  CASE
    WHEN ch.id IS NULL THEN 1
    WHEN ch.status = 'vencido' THEN 2
    WHEN ch.status = 'pendente' THEN 3
    WHEN ch.status = 'em_analise' THEN 4
    WHEN ch.status = 'reprovado' THEN 5
    ELSE 6
  END AS prioridade_ordem,
  ca.id AS carrier_id, ca.company_id
FROM carriers ca
  JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
  LEFT JOIN LATERAL (
    SELECT ch2.* FROM carrier_homologations ch2
    WHERE ch2.carrier_id = ca.id ORDER BY ch2.created_at DESC LIMIT 1
  ) ch ON true
  LEFT JOIN LATERAL (
    SELECT cad.cidade, cad.estado FROM company_addresses cad
    WHERE cad.company_id = co.id ORDER BY cad.is_primary DESC LIMIT 1
  ) addr ON true
WHERE ca.homologado = false
ORDER BY (
  CASE
    WHEN ch.id IS NULL THEN 1
    WHEN ch.status = 'vencido' THEN 2
    WHEN ch.status = 'pendente' THEN 3
    WHEN ch.status = 'em_analise' THEN 4
    WHEN ch.status = 'reprovado' THEN 5
    ELSE 6
  END), co.nome_crm;

-- Passo 35: vw_carrier_evaluations_history
CREATE VIEW vw_carrier_evaluations_history AS
SELECT co.nome_crm AS transportadora,
  ce.data_avaliacao, ce.referencia,
  ce.nota_pontualidade, ce.nota_conservacao, ce.nota_preco_frete,
  ce.nota_rastreamento, ce.nota_cobertura, ce.nota_geral,
  ce.comentario,
  u.name AS avaliador, u.departamento AS departamento_avaliador,
  ca.id AS carrier_id, ca.company_id,
  ce.id AS evaluation_id, ce.created_at
FROM carrier_evaluations ce
  JOIN carriers ca ON ca.id = ce.carrier_id
  JOIN companies co ON co.id = ca.company_id
  JOIN users u ON u.id = ce.avaliador_id
ORDER BY ce.data_avaliacao DESC, ce.created_at DESC;

COMMENT ON VIEW vw_carrier_homologation_control IS 'Controle de homologação de transportadoras: situação calculada, dias para vencer';
COMMENT ON VIEW vw_carrier_homologation_queue IS 'Fila de trabalho para Logística: transportadoras não homologadas priorizadas por urgência';
COMMENT ON VIEW vw_carrier_evaluations_history IS 'Histórico de avaliações de transportadoras com dados do avaliador';
