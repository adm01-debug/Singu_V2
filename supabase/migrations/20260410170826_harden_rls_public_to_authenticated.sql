-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260410170826
-- nome:   harden_rls_public_to_authenticated

DO $$
DECLARE
  p record;
  cnt int := 0;
  err int := 0;
  cmd_keyword text;
  using_clause text;
  check_clause text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, cmd, qual, with_check, roles
    FROM pg_policies
    WHERE schemaname='public'
      AND 'public' = ANY(roles)
      AND (qual='true' OR with_check='true' OR (qual IS NULL AND with_check='true'))
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                     p.policyname, p.schemaname, p.tablename);

      cmd_keyword := CASE p.cmd
        WHEN 'SELECT' THEN 'SELECT'
        WHEN 'INSERT' THEN 'INSERT'
        WHEN 'UPDATE' THEN 'UPDATE'
        WHEN 'DELETE' THEN 'DELETE'
        ELSE 'ALL'
      END;

      using_clause := CASE WHEN p.qual IS NOT NULL
                           THEN format(' USING (%s)', p.qual)
                           ELSE '' END;
      check_clause := CASE WHEN p.with_check IS NOT NULL
                           THEN format(' WITH CHECK (%s)', p.with_check)
                           ELSE '' END;

      EXECUTE format(
        'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR %s TO authenticated%s%s',
        p.policyname, p.schemaname, p.tablename,
        cmd_keyword, using_clause, check_clause
      );
      cnt := cnt + 1;
    EXCEPTION WHEN OTHERS THEN
      err := err + 1;
      RAISE NOTICE 'Falhou %.% policy %: %', p.schemaname, p.tablename, p.policyname, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Recriadas: %, falhas: %', cnt, err;
END $$;
