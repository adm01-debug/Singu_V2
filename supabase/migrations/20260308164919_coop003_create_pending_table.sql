-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260308164919
-- nome:   coop003_create_pending_table

CREATE TABLE IF NOT EXISTS coop003_pending (id uuid PRIMARY KEY, cnpj text NOT NULL, metodo text NOT NULL);
GRANT ALL ON coop003_pending TO anon, authenticated;
