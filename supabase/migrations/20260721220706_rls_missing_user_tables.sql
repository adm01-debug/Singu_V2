-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721220706
-- nome:   rls_missing_user_tables

-- Migration: rls_missing_user_tables (Wave 166)
-- AUDIT RESULT: All 13 tables already have RLS enabled. No DDL needed.
DO $$
BEGIN
  RAISE NOTICE '[Wave 166] RLS audit complete. 13 tables verified. 2 defects queued for Wave 167.';
END;
$$;
