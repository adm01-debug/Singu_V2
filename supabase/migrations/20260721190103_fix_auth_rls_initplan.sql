-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721190103
-- nome:   fix_auth_rls_initplan

DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
BEGIN
  FOR p IN
    SELECT
      tablename,
      policyname,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual      IS NOT NULL AND qual      ~ 'auth\.uid\(\)' AND qual      !~ 'SELECT auth\.uid\(\)')
        OR
        (with_check IS NOT NULL AND with_check ~ 'auth\.uid\(\)' AND with_check !~ 'SELECT auth\.uid\(\)')
      )
    ORDER BY tablename, policyname
  LOOP
    new_qual  := regexp_replace(p.qual,       'auth\.uid\(\)', '(SELECT auth.uid())', 'g');
    new_check := regexp_replace(p.with_check, 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');

    BEGIN
      IF p.qual IS NOT NULL AND p.with_check IS NOT NULL THEN
        EXECUTE format(
          'ALTER POLICY %I ON public.%I USING %s WITH CHECK %s',
          p.policyname, p.tablename, new_qual, new_check
        );
      ELSIF p.qual IS NOT NULL THEN
        EXECUTE format(
          'ALTER POLICY %I ON public.%I USING %s',
          p.policyname, p.tablename, new_qual
        );
      ELSE
        EXECUTE format(
          'ALTER POLICY %I ON public.%I WITH CHECK %s',
          p.policyname, p.tablename, new_check
        );
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not alter policy % on %: %', p.policyname, p.tablename, SQLERRM;
    END;
  END LOOP;
END $$;
