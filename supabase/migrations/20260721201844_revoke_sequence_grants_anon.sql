-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721201844
-- nome:   revoke_sequence_grants_anon

-- Migration: revoke_sequence_grants_anon (Wave 149)
-- All INSERT policies use WITH CHECK(auth.uid() = user_id) so anon can
-- never INSERT. anon has no legitimate need for sequence USAGE/SELECT/UPDATE.
-- Also revokes UPDATE (setval) from authenticated — admin operation only.

REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE UPDATE ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
