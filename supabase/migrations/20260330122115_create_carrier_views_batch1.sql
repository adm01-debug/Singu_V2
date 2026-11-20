-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330122115
-- nome:   create_carrier_views_batch1

-- Passo 30: vw_carriers_completo
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
  JOIN companies co ON co.id = ca.company_id
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

-- Passo 31: vw_carrier_qualification_dashboard
CREATE VIEW vw_carrier_qualification_dashboard AS
SELECT 
  count(*) AS total_transportadoras,
  count(*) FILTER (WHERE ca.homologado = true) AS total_homologados,
  count(*) FILTER (WHERE ca.homologado = false) AS total_nao_homologados,
  round(100.0 * count(*) FILTER (WHERE ca.homologado = true)::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_homologados,
  count(*) FILTER (WHERE cs.segment_code = 'excelente') AS qtd_excelente,
  count(*) FILTER (WHERE cs.segment_code = 'bom') AS qtd_bom,
  count(*) FILTER (WHERE cs.segment_code = 'regular') AS qtd_regular,
  count(*) FILTER (WHERE cs.segment_code = 'insuficiente') AS qtd_insuficiente,
  count(*) FILTER (WHERE cs.segment_code = 'critico') AS qtd_critico,
  count(*) FILTER (WHERE cs.carrier_id IS NULL) AS qtd_sem_avaliacao,
  round(avg(cs.score_geral), 2) AS score_medio_geral,
  count(*) FILTER (WHERE cs.trend = 'melhorando') AS qtd_melhorando,
  count(*) FILTER (WHERE cs.trend = 'estavel') AS qtd_estavel,
  count(*) FILTER (WHERE cs.trend = 'piorando') AS qtd_piorando,
  count(*) FILTER (WHERE hom.status = 'pendente') AS homologacoes_pendentes,
  count(*) FILTER (WHERE hom.status = 'em_analise') AS homologacoes_em_analise,
  count(*) FILTER (WHERE hom.validade < CURRENT_DATE) AS homologacoes_vencidas,
  count(*) FILTER (WHERE hom.validade >= CURRENT_DATE AND hom.validade <= CURRENT_DATE + 30) AS homologacoes_vencendo_30d,
  COALESCE(sum(cs.total_avaliacoes), 0) AS total_avaliacoes_realizadas,
  (SELECT count(*) FROM carrier_evaluations WHERE data_avaliacao >= CURRENT_DATE - 30) AS avaliacoes_ultimos_30d
FROM carriers ca
  JOIN companies c ON c.id = ca.company_id AND c.deleted_at IS NULL
  LEFT JOIN carrier_scores cs ON cs.carrier_id = ca.id
  LEFT JOIN LATERAL (
    SELECT ch.status, ch.validade FROM carrier_homologations ch
    WHERE ch.carrier_id = ca.id ORDER BY ch.created_at DESC LIMIT 1
  ) hom ON true;

-- Passo 32: vw_carrier_ranking
CREATE VIEW vw_carrier_ranking AS
SELECT 
  rank() OVER (ORDER BY cs.score_geral DESC NULLS LAST) AS ranking,
  co.nome_crm AS transportadora, co.cnpj, ca.homologado,
  cs.score_geral, cs.score_pontualidade, cs.score_conservacao,
  cs.score_preco_frete, cs.score_rastreamento, cs.score_cobertura,
  cs.classificacao, cs.segment_code, cs.trend,
  cs.total_avaliacoes, cs.ultima_avaliacao, cs.score_change,
  cqc.color AS segment_color,
  ca.id AS carrier_id, ca.company_id
FROM carriers ca
  JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
  LEFT JOIN carrier_scores cs ON cs.carrier_id = ca.id
  LEFT JOIN carrier_qualification_config cqc ON cqc.segment_code = cs.segment_code
ORDER BY cs.score_geral DESC NULLS LAST;

COMMENT ON VIEW vw_carriers_completo IS 'View detalhada de transportadoras com todos os campos, scores, homologação e dados da company';
COMMENT ON VIEW vw_carrier_qualification_dashboard IS 'Dashboard gerencial consolidado de transportadoras: totais, segmentos, trends, homologações';
COMMENT ON VIEW vw_carrier_ranking IS 'Ranking de transportadoras por score DESC com cores de segmento';
