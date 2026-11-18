-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330122052
-- nome:   recreate_vw_carriers

-- Drop view antiga que referencia pix_accounts dormant
DROP VIEW IF EXISTS vw_carriers;

CREATE VIEW vw_carriers AS
SELECT c.id,
  c.bitrix_company_id,
  c.nome_crm AS title,
  c.cnpj,
  (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id AND cp.is_primary = true LIMIT 1) AS phone,
  (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary = true LIMIT 1) AS email,
  addr.cidade,
  addr.estado,
  ca2.tipo_transporte,
  ca2.homologado,
  ca2.data_homologacao,
  ca2.score_geral,
  cs.classificacao,
  cs.segment_code,
  cs.trend,
  cs.total_avaliacoes,
  cs.ultima_avaliacao,
  hom.status AS homologation_status,
  hom.validade AS homologation_validade,
  c.created_at
FROM companies c
  JOIN carriers ca2 ON ca2.company_id = c.id
  LEFT JOIN carrier_scores cs ON cs.carrier_id = ca2.id
  LEFT JOIN LATERAL (
    SELECT ch.status, ch.validade
    FROM carrier_homologations ch
    WHERE ch.carrier_id = ca2.id
    ORDER BY ch.created_at DESC LIMIT 1
  ) hom ON true
  LEFT JOIN LATERAL (
    SELECT ca.cidade, ca.estado
    FROM company_addresses ca
    WHERE ca.company_id = c.id
    ORDER BY ca.is_primary DESC LIMIT 1
  ) addr ON true
WHERE c.deleted_at IS NULL AND c.is_carrier = true;

COMMENT ON VIEW vw_carriers IS 'View compacta de transportadoras: dados + homologação + score. Sem pix_accounts (dormant).';
