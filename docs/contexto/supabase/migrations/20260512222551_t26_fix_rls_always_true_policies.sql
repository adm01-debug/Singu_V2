DO $$
DECLARE
  r RECORD;
BEGIN
  -- Pass 1: {authenticated} INSERT / UPDATE with WITH CHECK (true)
  FOR r IN
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'authenticated' = ANY(roles)
      AND 'service_role'  <> ALL(roles)
      AND cmd IN ('INSERT', 'UPDATE')
      AND with_check = 'true'
    ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I WITH CHECK ((auth.uid() IS NOT NULL))',
        r.policyname, r.tablename
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Pass1 skip % on %: %', r.policyname, r.tablename, SQLERRM;
    END;
  END LOOP;

  -- Pass 2: {authenticated} ALL with USING/WITH CHECK (true)
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'authenticated' = ANY(roles)
      AND 'service_role'  <> ALL(roles)
      AND cmd = 'ALL'
      AND with_check = 'true'
    ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I '
        'USING ((auth.uid() IS NOT NULL)) '
        'WITH CHECK ((auth.uid() IS NOT NULL))',
        r.policyname, r.tablename
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Pass2 skip % on %: %', r.policyname, r.tablename, SQLERRM;
    END;
  END LOOP;

  -- Pass 3: {public} INSERT / UPDATE → move to {authenticated}
  FOR r IN
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'public' = ANY(roles)
      AND cmd IN ('INSERT', 'UPDATE')
      AND with_check = 'true'
    ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I '
        'TO authenticated '
        'WITH CHECK ((auth.uid() IS NOT NULL))',
        r.policyname, r.tablename
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Pass3 skip % on %: %', r.policyname, r.tablename, SQLERRM;
    END;
  END LOOP;

  -- Pass 4: {public} ALL → move to {authenticated}, fix both clauses
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND 'public' = ANY(roles)
      AND cmd = 'ALL'
      AND with_check = 'true'
    ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I '
        'TO authenticated '
        'USING ((auth.uid() IS NOT NULL)) '
        'WITH CHECK ((auth.uid() IS NOT NULL))',
        r.policyname, r.tablename
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Pass4 skip % on %: %', r.policyname, r.tablename, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'T26 complete: rls_policy_always_true write-policies corrected.';
END;
$$;
