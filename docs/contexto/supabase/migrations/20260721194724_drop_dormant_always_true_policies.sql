DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = '_dormant'
      AND (
        (qual      IS NOT NULL AND trim(qual)        = 'true')
        OR
        (with_check IS NOT NULL AND trim(with_check) = 'true')
      )
    ORDER BY tablename, policyname
  LOOP
    BEGIN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON _dormant.%I',
        p.policyname, p.tablename
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not drop policy % on _dormant.%: %',
          p.policyname, p.tablename, SQLERRM;
    END;
  END LOOP;
END $$;
