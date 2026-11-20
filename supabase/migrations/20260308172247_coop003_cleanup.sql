-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260308172247
-- nome:   coop003_cleanup

DROP FUNCTION IF EXISTS coop003_exec(text);
DROP FUNCTION IF EXISTS coop003_batch_update(text[], text[], text[]);
DROP FUNCTION IF EXISTS coop003_finalize();
DROP TABLE IF EXISTS coop003_pending;
