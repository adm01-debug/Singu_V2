-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721191201
-- nome:   fix_auth_rls_initplan_dormant_zapp

-- Migration: fix_auth_rls_initplan_dormant_zapp (Wave 121)
-- Same initplan fix as Wave 118, extended to _dormant and zapp_history schemas.

DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
BEGIN
  FOR p IN
    SELECT
      schemaname,
      tablename,
      policyname,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname IN ('_dormant', 'zapp_history')
      AND (
        (qual      IS NOT NULL AND qual      ~ 'auth\.uid\(\)' AND qual      !~ 'SELECT auth\.uid\(\)')
        OR
        (with_check IS NOT NULL AND with_check ~ 'auth\.uid\(\)' AND with_check !~ 'SELECT auth\.uid\(\)')
      )
    ORDER BY schemaname, tablename, policyname
  LOOP
    new_qual  := regexp_replace(p.qual,       'auth\.uid\(\)', '(SELECT auth.uid())', 'g');
    new_check := regexp_replace(p.with_check, 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');

    BEGIN
      IF p.qual IS NOT NULL AND p.with_check IS NOT NULL THEN
        EXECUTE format(
          'ALTER POLICY %I ON %I.%I USING %s WITH CHECK %s',
          p.policyname, p.schemaname, p.tablename, new_qual, new_check
        );
      ELSIF p.qual IS NOT NULL THEN
        EXECUTE format(
          'ALTER POLICY %I ON %I.%I USING %s',
          p.policyname, p.schemaname, p.tablename, new_qual
        );
      ELSE
        EXECUTE format(
          'ALTER POLICY %I ON %I.%I WITH CHECK %s',
          p.policyname, p.schemaname, p.tablename, new_check
        );
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not alter policy % on %.%: %', p.policyname, p.schemaname, p.tablename, SQLERRM;
    END;
  END LOOP;
END $$;
