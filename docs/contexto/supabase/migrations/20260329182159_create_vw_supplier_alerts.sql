CREATE VIEW vw_supplier_alerts AS
SELECT 
  a.id AS alert_id,
  a.type,
  a.priority,
  a.title,
  a.message,
  a.status AS alert_status,
  a.metadata,
  a.created_at,
  a.read_at,
  co.nome_crm AS fornecedor,
  co.cnpj,
  s.homologado,
  s.score_geral
FROM alerts a
JOIN companies co ON co.id = a.company_id
LEFT JOIN suppliers s ON s.company_id = a.company_id
WHERE a.type LIKE 'supplier_%'
ORDER BY 
  CASE a.priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'normal' THEN 3 
    ELSE 4 
  END,
  a.created_at DESC;
