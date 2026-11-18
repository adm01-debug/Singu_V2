-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260313163246
-- nome:   add_cnae_columns_to_companies

ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnae_principal VARCHAR(10);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnae_principal_desc VARCHAR(200);
COMMENT ON COLUMN companies.cnae_principal IS 'CNAE fiscal principal (código numérico, ex: 6424702)';
COMMENT ON COLUMN companies.cnae_principal_desc IS 'Descrição do CNAE fiscal principal';
