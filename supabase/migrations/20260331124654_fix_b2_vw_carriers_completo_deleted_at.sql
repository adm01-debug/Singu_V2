-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260331124654
-- nome:   fix_b2_vw_carriers_completo_deleted_at

DROP VIEW IF EXISTS vw_carriers_completo;

CREATE VIEW vw_carriers_completo AS
SELECT ca.id, ca.company_id,
  ca.tipo_transporte, ca.grupo_economico, ca.estados_atendidos, ca.cidades_atendidas,
  ca.prazo_por_trecho, ca.tipo_frete, ca.tabela_frete,
  ca.homologado, ca.data_homologacao, ca.score_geral,
  ca.created_at, ca.updated_at,
  co.razao_social, co.nome_fantasia, co.nome_crm AS company_title, co.cnpj,
  co.status AS company_status, co.situacao_rf, co.porte_rf, co.capital_social,
  cs.score_pontualidade, cs.score_conservacao, cs.score_preco_frete,
  cs.score_rastreamento, cs.score_cobertura,
  cs.classificacao, cs.segment_code, cs.trend,
  cs.total_avaliacoes, cs.ultima_avaliacao, cs.previous_score, cs.score_change,
  hom.homologation_id, hom.homologation_status, hom.homologation_validade,
  hom.homologation_avaliador, hom.homologation_data_decisao,
  phone.numero AS telefone_principal,
  email.email AS email_principal,
  addr.cidade, addr.estado
FROM carriers ca
  JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
  LEFT JOIN carrier_scores cs ON cs.carrier_id = ca.id
  LEFT JOIN LATERAL (
    SELECT ch.id AS homologation_id, ch.status AS homologation_status,
      ch.validade AS homologation_validade, u.name AS homologation_avaliador,
      ch.data_decisao AS homologation_data_decisao
    FROM carrier_homologations ch LEFT JOIN users u ON u.id = ch.avaliador_id
    WHERE ch.carrier_id = ca.id ORDER BY ch.created_at DESC LIMIT 1
  ) hom ON true
  LEFT JOIN LATERAL (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = co.id AND cp.is_primary = true LIMIT 1) phone ON true
  LEFT JOIN LATERAL (SELECT ce.email FROM company_emails ce WHERE ce.company_id = co.id AND ce.is_primary = true LIMIT 1) email ON true
  LEFT JOIN LATERAL (SELECT cad.cidade, cad.estado FROM company_addresses cad WHERE cad.company_id = co.id ORDER BY cad.is_primary DESC LIMIT 1) addr ON true;

COMMENT ON VIEW vw_carriers_completo IS 'View detalhada de transportadoras. FIX B2: filtra deleted_at IS NULL.';
