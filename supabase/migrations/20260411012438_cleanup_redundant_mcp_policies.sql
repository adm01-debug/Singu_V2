-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260411012438
-- nome:   cleanup_redundant_mcp_policies

DO $$
DECLARE
  p record;
  cnt int := 0;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND policyname LIKE 'mcp_%'
      AND EXISTS (
        SELECT 1 FROM pg_policies p2
        WHERE p2.schemaname=pg_policies.schemaname
          AND p2.tablename=pg_policies.tablename
          AND p2.policyname <> pg_policies.policyname
          AND p2.cmd = pg_policies.cmd
          AND p2.permissive = pg_policies.permissive
          AND p2.roles && pg_policies.roles
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    cnt := cnt + 1;
  END LOOP;
  RAISE NOTICE 'Policies mcp_* duplicadas removidas: %', cnt;
END $$;
