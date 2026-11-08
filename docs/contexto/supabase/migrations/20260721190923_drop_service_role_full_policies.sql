DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname = 'service_role_full'
    ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not drop policy % on %: %', p.policyname, p.tablename, SQLERRM;
    END;
  END LOOP;
END $$;
