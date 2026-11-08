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
