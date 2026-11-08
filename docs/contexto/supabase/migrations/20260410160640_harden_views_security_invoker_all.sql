DO $$
DECLARE
  v record;
  cnt int := 0;
BEGIN
  FOR v IN
    SELECT n.nspname, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'
      AND n.nspname = 'public'
  LOOP
    EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = on)', v.nspname, v.relname);
    cnt := cnt + 1;
  END LOOP;
  RAISE NOTICE 'Views convertidas para SECURITY INVOKER: %', cnt;
END $$;
