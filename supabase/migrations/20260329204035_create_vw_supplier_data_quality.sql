-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329204035
-- nome:   create_vw_supplier_data_quality

CREATE VIEW vw_supplier_data_quality AS
SELECT
  COUNT(*) AS total_fornecedores,
  -- CNPJ
  COUNT(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj != '') AS com_cnpj,
  ROUND(100.0 * COUNT(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj != '') / COUNT(*), 1) AS pct_cnpj,
  -- Razão Social
  COUNT(*) FILTER (WHERE co.razao_social IS NOT NULL AND co.razao_social != '') AS com_razao_social,
  -- Telefone
  COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id)) AS com_telefone,
  ROUND(100.0 * COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id)) / COUNT(*), 1) AS pct_telefone,
  -- Email
  COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id)) AS com_email,
  ROUND(100.0 * COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id)) / COUNT(*), 1) AS pct_email,
  -- Endereço
  COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_addresses ca WHERE ca.company_id = co.id)) AS com_endereco,
  ROUND(100.0 * COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM company_addresses ca WHERE ca.company_id = co.id)) / COUNT(*), 1) AS pct_endereco,
  -- Contatos (pessoas de contato)
  COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM contacts ct WHERE ct.company_id = co.id)) AS com_contato,
  ROUND(100.0 * COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM contacts ct WHERE ct.company_id = co.id)) / COUNT(*), 1) AS pct_contato,
  -- Receita Federal
  COUNT(*) FILTER (WHERE co.situacao_rf IS NOT NULL) AS com_situacao_rf,
  -- Sem NENHUM dado de contato
  COUNT(*) FILTER (WHERE 
    NOT EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id) AND
    NOT EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id)
  ) AS sem_nenhum_contato,
  -- Completude (tem CNPJ + telefone + email + endereço)
  COUNT(*) FILTER (WHERE 
    co.cnpj IS NOT NULL AND co.cnpj != '' AND
    EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id) AND
    EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id) AND
    EXISTS(SELECT 1 FROM company_addresses ca WHERE ca.company_id = co.id)
  ) AS cadastro_completo,
  ROUND(100.0 * COUNT(*) FILTER (WHERE 
    co.cnpj IS NOT NULL AND co.cnpj != '' AND
    EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id) AND
    EXISTS(SELECT 1 FROM company_emails ce WHERE ce.company_id = co.id) AND
    EXISTS(SELECT 1 FROM company_addresses ca WHERE ca.company_id = co.id)
  ) / COUNT(*), 1) AS pct_cadastro_completo
FROM suppliers s
JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL;
