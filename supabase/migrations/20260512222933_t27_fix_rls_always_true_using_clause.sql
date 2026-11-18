-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260512222933
-- nome:   t27_fix_rls_always_true_using_clause

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Pass A: {public} ALL (USING true, WITH CHECK NULL) → authenticated
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND 'public'=ANY(roles) AND cmd='ALL'
      AND qual='true' AND with_check IS NULL ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL))', r.policyname, r.tablename);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PassA skip % on %: %',r.policyname,r.tablename,SQLERRM; END;
  END LOOP;

  -- Pass B: {public} UPDATE → authenticated
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND 'public'=ANY(roles) AND cmd='UPDATE'
      AND qual='true' ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated USING ((auth.uid() IS NOT NULL))', r.policyname, r.tablename);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PassB skip % on %: %',r.policyname,r.tablename,SQLERRM; END;
  END LOOP;

  -- Pass C: {public} DELETE → authenticated
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND 'public'=ANY(roles) AND cmd='DELETE'
      AND qual='true' ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated USING ((auth.uid() IS NOT NULL))', r.policyname, r.tablename);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PassC skip % on %: %',r.policyname,r.tablename,SQLERRM; END;
  END LOOP;

  -- Pass D: {public} SELECT → authenticated
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND 'public'=ANY(roles) AND cmd='SELECT'
      AND qual='true' ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated USING ((auth.uid() IS NOT NULL))', r.policyname, r.tablename);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PassD skip % on %: %',r.policyname,r.tablename,SQLERRM; END;
  END LOOP;

  -- Pass E: {authenticated} ALL (USING true, WITH CHECK NULL)
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND 'authenticated'=ANY(roles) AND 'service_role'<>ALL(roles)
      AND cmd='ALL' AND qual='true' AND with_check IS NULL ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format('ALTER POLICY %I ON public.%I USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL))', r.policyname, r.tablename);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PassE skip % on %: %',r.policyname,r.tablename,SQLERRM; END;
  END LOOP;

  -- Pass F: {authenticated} UPDATE
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND 'authenticated'=ANY(roles) AND 'service_role'<>ALL(roles)
      AND cmd='UPDATE' AND qual='true' ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format('ALTER POLICY %I ON public.%I USING ((auth.uid() IS NOT NULL))', r.policyname, r.tablename);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PassF skip % on %: %',r.policyname,r.tablename,SQLERRM; END;
  END LOOP;

  -- Pass G: {authenticated} DELETE
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND 'authenticated'=ANY(roles) AND 'service_role'<>ALL(roles)
      AND cmd='DELETE' AND qual='true' ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format('ALTER POLICY %I ON public.%I USING ((auth.uid() IS NOT NULL))', r.policyname, r.tablename);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PassG skip % on %: %',r.policyname,r.tablename,SQLERRM; END;
  END LOOP;

  -- Pass H: {authenticated} SELECT — linter fix
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname='public' AND 'authenticated'=ANY(roles) AND 'service_role'<>ALL(roles)
      AND cmd='SELECT' AND qual='true' ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format('ALTER POLICY %I ON public.%I USING ((auth.uid() IS NOT NULL))', r.policyname, r.tablename);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'PassH skip % on %: %',r.policyname,r.tablename,SQLERRM; END;
  END LOOP;

  RAISE NOTICE 'T27 complete: all remaining USING(true) policies corrected.';
END;
$$;
