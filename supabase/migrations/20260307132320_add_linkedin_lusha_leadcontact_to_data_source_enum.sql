-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260307132320
-- nome:   add_linkedin_lusha_leadcontact_to_data_source_enum

-- Adiciona novos valores ao enum data_source
ALTER TYPE data_source ADD VALUE IF NOT EXISTS 'LINKEDIN';
ALTER TYPE data_source ADD VALUE IF NOT EXISTS 'LUSHA';
ALTER TYPE data_source ADD VALUE IF NOT EXISTS 'LEADCONTACT';
