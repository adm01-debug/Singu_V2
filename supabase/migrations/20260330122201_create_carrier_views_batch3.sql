-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330122201
-- nome:   create_carrier_views_batch3

-- Passo 36: vw_carrier_alerts
CREATE VIEW vw_carrier_alerts AS
SELECT a.id AS alert_id, a.type, a.priority, a.title, a.message,
  a.status AS alert_status, a.metadata, a.created_at, a.read_at,
  co.nome_crm AS transportadora, co.cnpj,
  ca.homologado, ca.score_geral
FROM alerts a
  JOIN companies co ON co.id = a.company_id
  LEFT JOIN carriers ca ON ca.company_id = a.company_id
WHERE a.type LIKE 'carrier_%'
ORDER BY (
  CASE a.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    ELSE 5
  END), a.created_at DESC;

-- Passo 37: vw_carrier_data_quality
CREATE VIEW vw_carrier_data_quality AS
SELECT 
  count(*) AS total_transportadoras,
  count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> '') AS com_cnpj,
  round(100.0 * count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> '')::numeric / count(*)::numeric, 1) AS pct_cnpj,
  count(*) FILTER (WHERE co.razao_social IS NOT NULL AND co.razao_social <> '') AS com_razao_social,
  count(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id)) AS com_telefone,
  round(100.0 * count(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id))::numeric / count(*)::numeric, 1) AS pct_telefone,
  count(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id)) AS com_email,
  round(100.0 * count(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id))::numeric / count(*)::numeric, 1) AS pct_email,
  count(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_addresses cad WHERE cad.company_id = co.id)) AS com_endereco,
  round(100.0 * count(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_addresses cad WHERE cad.company_id = co.id))::numeric / count(*)::numeric, 1) AS pct_endereco,
  count(*) FILTER (WHERE EXISTS(SELECT 1 FROM contacts ct WHERE ct.company_id = co.id)) AS com_contato,
  round(100.0 * count(*) FILTER (WHERE EXISTS(SELECT 1 FROM contacts ct WHERE ct.company_id = co.id))::numeric / count(*)::numeric, 1) AS pct_contato,
  count(*) FILTER (WHERE co.situacao_rf IS NOT NULL) AS com_situacao_rf,
  count(*) FILTER (WHERE NOT EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id) 
    AND NOT EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id)) AS sem_nenhum_contato,
  count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> '' 
    AND EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id)
    AND EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id)
    AND EXISTS(SELECT 1 FROM company_addresses cad WHERE cad.company_id = co.id)) AS cadastro_completo,
  round(100.0 * count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> '' 
    AND EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id)
    AND EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id)
    AND EXISTS(SELECT 1 FROM company_addresses cad WHERE cad.company_id = co.id))::numeric / count(*)::numeric, 1) AS pct_cadastro_completo
FROM carriers ca
  JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL;

-- Passo 38: vw_carrier_by_state
CREATE VIEW vw_carrier_by_state AS
SELECT 
  COALESCE(addr.estado, 'SEM ESTADO') AS estado,
  count(*) AS total,
  count(*) FILTER (WHERE ca.homologado = true) AS homologados,
  count(*) FILTER (WHERE ca.homologado = false) AS nao_homologados,
  round(avg(cs.score_geral), 2) AS score_medio,
  count(cs.carrier_id) AS com_avaliacao
FROM carriers ca
  JOIN companies co ON co.id = ca.company_id AND co.deleted_at IS NULL
  LEFT JOIN carrier_scores cs ON cs.carrier_id = ca.id
  LEFT JOIN LATERAL (
    SELECT cad.estado FROM company_addresses cad
    WHERE cad.company_id = co.id ORDER BY cad.is_primary DESC LIMIT 1
  ) addr ON true
GROUP BY addr.estado
ORDER BY count(*) DESC;

COMMENT ON VIEW vw_carrier_alerts IS 'Alertas ativos de transportadoras (carrier_*) ordenados por prioridade';
COMMENT ON VIEW vw_carrier_data_quality IS 'Radiografia de qualidade de dados das transportadoras: % CNPJ, telefone, email, endereço, contato';
COMMENT ON VIEW vw_carrier_by_state IS 'Distribuição geográfica de transportadoras por estado com scores médios';
