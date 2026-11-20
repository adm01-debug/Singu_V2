-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329203923
-- nome:   add_check_constraints_score_range

-- Proteção de range no nível do banco (além da function)
ALTER TABLE supplier_scores ADD CONSTRAINT chk_score_geral_range CHECK (score_geral BETWEEN 0 AND 100);
ALTER TABLE supplier_scores ADD CONSTRAINT chk_score_preco_range CHECK (score_preco BETWEEN 0 AND 100);
ALTER TABLE supplier_scores ADD CONSTRAINT chk_score_prazo_range CHECK (score_prazo BETWEEN 0 AND 100);
ALTER TABLE supplier_scores ADD CONSTRAINT chk_score_qualidade_range CHECK (score_qualidade BETWEEN 0 AND 100);
ALTER TABLE supplier_scores ADD CONSTRAINT chk_score_entrega_range CHECK (score_entrega BETWEEN 0 AND 100);
ALTER TABLE suppliers ADD CONSTRAINT chk_suppliers_score_range CHECK (score_geral IS NULL OR score_geral BETWEEN 0 AND 100);
