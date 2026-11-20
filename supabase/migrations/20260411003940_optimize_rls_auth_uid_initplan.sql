-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260411003940
-- nome:   optimize_rls_auth_uid_initplan

DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
  cmd_kw text;
  roles_list text;
  cnt int := 0;
  err int := 0;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname='public'
      AND (
        (qual ~ 'auth\.uid\(\)' AND qual !~ '\(select auth\.uid\(\)\)')
        OR
        (with_check ~ 'auth\.uid\(\)' AND with_check !~ '\(select auth\.uid\(\)\)')
      )
  LOOP
    BEGIN
      new_qual := regexp_replace(COALESCE(p.qual,''), 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');
      new_check := regexp_replace(COALESCE(p.with_check,''), 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');

      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                     p.policyname, p.schemaname, p.tablename);

      cmd_kw := CASE p.cmd WHEN 'SELECT' THEN 'SELECT' WHEN 'INSERT' THEN 'INSERT'
                           WHEN 'UPDATE' THEN 'UPDATE' WHEN 'DELETE' THEN 'DELETE'
                           ELSE 'ALL' END;

      roles_list := array_to_string(p.roles::text[], ', ');

      EXECUTE format(
        'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s %s %s',
        p.policyname, p.schemaname, p.tablename,
        p.permissive, cmd_kw, roles_list,
        CASE WHEN p.qual IS NOT NULL THEN format('USING (%s)', new_qual) ELSE '' END,
        CASE WHEN p.with_check IS NOT NULL THEN format('WITH CHECK (%s)', new_check) ELSE '' END
      );
      cnt := cnt + 1;
    EXCEPTION WHEN OTHERS THEN
      err := err + 1;
      RAISE NOTICE 'Falhou %.% %: %', p.schemaname, p.tablename, p.policyname, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Otimizadas: %, falhas: %', cnt, err;
END $$;
