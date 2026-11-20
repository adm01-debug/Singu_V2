-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329182149
-- nome:   create_composite_indexes_supplier_qualification

-- Index composto para dashboard: fornecedores homologados + score
CREATE INDEX idx_suppliers_homologado_score ON suppliers(homologado, score_geral DESC NULLS LAST);

-- Index para buscar homologação vigente rapidamente
CREATE INDEX idx_supplier_homologations_supplier_created ON supplier_homologations(supplier_id, created_at DESC);

-- Index para alertas de fornecedor
CREATE INDEX idx_alerts_type_company ON alerts(type, company_id) WHERE type LIKE 'supplier_%';

-- Index para score history por período
CREATE INDEX idx_supplier_score_history_measured ON supplier_score_history(measured_at DESC);
