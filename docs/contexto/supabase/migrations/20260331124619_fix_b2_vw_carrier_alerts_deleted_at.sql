DROP VIEW IF EXISTS vw_carrier_alerts;

CREATE VIEW vw_carrier_alerts AS
SELECT a.id AS alert_id, a.type, a.priority, a.title, a.message,
  a.status AS alert_status, a.metadata, a.created_at, a.read_at,
  co.nome_crm AS transportadora, co.cnpj,
  ca.homologado, ca.score_geral
FROM alerts a
  JOIN companies co ON co.id = a.company_id AND co.deleted_at IS NULL
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

COMMENT ON VIEW vw_carrier_alerts IS 'Alertas ativos de transportadoras (carrier_*). FIX B2: filtra deleted_at IS NULL.';
