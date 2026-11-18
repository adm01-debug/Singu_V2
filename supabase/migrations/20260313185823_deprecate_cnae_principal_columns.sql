-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260313185823
-- nome:   deprecate_cnae_principal_columns

ALTER TABLE companies RENAME COLUMN cnae_principal TO _deprecated_cnae_principal;
ALTER TABLE companies RENAME COLUMN cnae_principal_desc TO _deprecated_cnae_principal_desc;
