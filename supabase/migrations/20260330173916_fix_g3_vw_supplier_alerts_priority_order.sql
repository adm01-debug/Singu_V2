-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330173916
-- nome:   fix_g3_vw_supplier_alerts_priority_order

-- G3: vw_supplier_alerts usa 'urgent' e 'normal' no ORDER BY — valores inválidos
-- Valores corretos: critical, high, medium, low (conforme CHECK de alerts.priority)
DROP VIEW IF EXISTS vw_supplier_alerts;

CREATE VIEW vw_supplier_alerts AS
SELECT a.id AS alert_id,
  a.type, a.priority, a.title, a.message,
  a.status AS alert_status, a.metadata, a.created_at, a.read_at,
  co.nome_crm AS fornecedor, co.cnpj,
  s.homologado, s.score_geral
FROM alerts a
  JOIN companies co ON co.id = a.company_id
  LEFT JOIN suppliers s ON s.company_id = a.company_id
WHERE a.type LIKE 'supplier_%'
ORDER BY (
  CASE a.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    ELSE 5
  END), a.created_at DESC;

COMMENT ON VIEW vw_supplier_alerts IS 'Alertas ativos de fornecedores (supplier_*) ordenados por prioridade. FIX: corrigido ORDER BY que usava urgent/normal (inválidos).';
