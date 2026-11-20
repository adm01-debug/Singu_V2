-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721200110
-- nome:   dormant_explicit_deny_all_policies

-- Migration: dormant_explicit_deny_all_policies (Wave 140)
-- Adds explicit RESTRICTIVE USING(false) policies to all _dormant tables that
-- have RLS enabled but no policies (advisor: rls_enabled_no_policy).

DO $$
DECLARE
  t record;
  pol_name text;
BEGIN
  FOR t IN
    SELECT c.relname AS tname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = '_dormant'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
      AND NOT EXISTS (
        SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
      )
    ORDER BY c.relname
  LOOP
    pol_name := 'dormant_deny_all_' || t.tname;
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON _dormant.%I AS RESTRICTIVE FOR ALL USING (false)',
        pol_name, t.tname
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not create deny policy on _dormant.%: %', t.tname, SQLERRM;
    END;
  END LOOP;
END $$;
