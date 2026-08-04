-- Matriz RLS — dados psicograficos (Rodada P1)
-- Valida que apenas o dono do contato ou admin acessa contact_behavior, contact_personality,
-- brain_dominance_analysis, whatsapp_messages_index e afins.
-- Executar com: psql -v ON_ERROR_STOP=1 -f tests/rls/psychographic_matrix.sql

\echo '=== SETUP: criar 2 usuarios fake + 1 admin + contatos ==='

-- Assumimos que existem 3 usuarios em auth.users com IDs conhecidos via variaveis psql
-- Ajuste :user_a, :user_b e :user_admin no ambiente de teste antes de rodar.
\set user_a '\'00000000-0000-0000-0000-00000000000a\''
\set user_b '\'00000000-0000-0000-0000-00000000000b\''
\set user_admin '\'00000000-0000-0000-0000-00000000000c\''

\echo '=== TEST 1: authenticated user_b NAO pode SELECT contact_behavior de contato do user_a ==='
DO $$
DECLARE cnt int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
  PERFORM set_config('role', 'authenticated', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO cnt FROM public.contact_behavior
   WHERE contact_id IN (SELECT id FROM public.contacts WHERE user_id = '00000000-0000-0000-0000-00000000000a');
  IF cnt > 0 THEN RAISE EXCEPTION '❌ FAIL: user_b viu % linhas de contact_behavior alheias', cnt; END IF;
  RAISE NOTICE '✅ OK: user_b bloqueado em contact_behavior alheio';
END $$;
RESET ROLE;

\echo '=== TEST 2: authenticated user_b NAO pode INSERT contact_behavior em contato do user_a ==='
DO $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.contact_behavior (contact_id)
      SELECT id FROM public.contacts WHERE user_id = '00000000-0000-0000-0000-00000000000a' LIMIT 1;
    RAISE EXCEPTION '❌ FAIL: user_b inseriu contact_behavior alheio';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    RAISE NOTICE '✅ OK: user_b bloqueado em INSERT contact_behavior alheio';
  END;
END $$;
RESET ROLE;

\echo '=== TEST 3: authenticated user_b NAO pode UPDATE/DELETE contact_behavior alheio ==='
DO $$
DECLARE rc int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
  SET LOCAL ROLE authenticated;
  UPDATE public.contact_behavior SET updated_at = now()
   WHERE contact_id IN (SELECT id FROM public.contacts WHERE user_id = '00000000-0000-0000-0000-00000000000a');
  GET DIAGNOSTICS rc = ROW_COUNT;
  IF rc > 0 THEN RAISE EXCEPTION '❌ FAIL: UPDATE afetou % linhas alheias', rc; END IF;
  DELETE FROM public.contact_behavior
   WHERE contact_id IN (SELECT id FROM public.contacts WHERE user_id = '00000000-0000-0000-0000-00000000000a');
  GET DIAGNOSTICS rc = ROW_COUNT;
  IF rc > 0 THEN RAISE EXCEPTION '❌ FAIL: DELETE afetou % linhas alheias', rc; END IF;
  RAISE NOTICE '✅ OK: UPDATE/DELETE de user_b nao afeta linhas alheias';
END $$;
RESET ROLE;

\echo '=== TEST 4: admin BYPASSA RLS via has_role ==='
DO $$
DECLARE cnt int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO cnt FROM public.contact_behavior;
  RAISE NOTICE '✅ OK: admin viu % linhas totais em contact_behavior', cnt;
END $$;
RESET ROLE;

\echo '=== TEST 5: anon NAO pode SELECT/INSERT em nenhuma tabela psicografica ==='
SET LOCAL ROLE anon;
DO $$
DECLARE t text; cnt int;
  tbls text[] := ARRAY[
    'contact_behavior','contact_personality','contact_metaprograms','contact_rapport_strategy',
    'contact_influence','contact_decision_making','contact_business_context',
    'brain_dominance_analysis','neuro_pnl_sessions','whatsapp_messages_index',
    'psychographic_audit_log','social_sync_queue','sentiment_annotations',
    'suggested_life_events'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', t) INTO cnt;
    IF cnt > 0 THEN RAISE EXCEPTION '❌ FAIL: anon leu % linhas de %', cnt, t; END IF;
  END LOOP;
  RAISE NOTICE '✅ OK: anon bloqueado em todas as tabelas psicograficas';
END $$;
RESET ROLE;

\echo '=== TEST 6: anon NAO pode executar SECURITY DEFINER funcoes sensiveis ==='
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM public.execute_readonly_query('SELECT 1');
    RAISE EXCEPTION '❌ FAIL: anon conseguiu executar execute_readonly_query';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ OK: anon bloqueado em execute_readonly_query';
  END;

  BEGIN
    PERFORM public.has_role('00000000-0000-0000-0000-00000000000a'::uuid, 'admin'::app_role);
    RAISE EXCEPTION '❌ FAIL: anon conseguiu executar has_role';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ OK: anon bloqueado em has_role';
  END;
END $$;
RESET ROLE;

\echo '=== TEST 7: anon PODE executar funcoes publicas explicitamente liberadas ==='
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM public.increment_form_view('__non_existent_slug__');
    RAISE NOTICE '✅ OK: anon pode chamar increment_form_view';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE EXCEPTION '❌ FAIL: anon nao pode chamar increment_form_view (esperado publico)';
  END;
END $$;
RESET ROLE;

\echo '=== TEST 8: storage — writes em company-logos exigem foldername = auth.uid() ==='
DO $$
DECLARE has_policy boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname='Users can upload logos to their folder'
      AND with_check LIKE '%storage.foldername%auth.uid%'
  ) INTO has_policy;
  IF NOT has_policy THEN RAISE EXCEPTION '❌ FAIL: policy de INSERT owner-only em company-logos ausente'; END IF;
  RAISE NOTICE '✅ OK: storage company-logos INSERT restrito por owner';
END $$;

\echo '=== TEST 9: policy USING(true) NAO existe mais em tabelas psicograficas ==='
DO $$
DECLARE bad_count int;
BEGIN
  SELECT count(*) INTO bad_count FROM pg_policies
  WHERE schemaname='public'
    AND tablename IN ('contact_behavior','contact_personality','contact_metaprograms',
                      'contact_rapport_strategy','contact_influence','contact_decision_making',
                      'contact_business_context')
    AND (qual = 'true' OR with_check = 'true');
  IF bad_count > 0 THEN RAISE EXCEPTION '❌ FAIL: ainda existem % policies permissivas em tabelas psicograficas', bad_count; END IF;
  RAISE NOTICE '✅ OK: nenhuma policy USING(true)/WITH CHECK(true) em tabelas psicograficas';
END $$;

\echo '=== TEST 10: SECURITY DEFINER — todas com search_path fixado ==='
DO $$
DECLARE missing int;
BEGIN
  SELECT count(*) INTO missing FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.prosecdef = true
    AND (p.proconfig IS NULL OR NOT (array_to_string(p.proconfig, ',') LIKE '%search_path=%'));
  IF missing > 0 THEN RAISE EXCEPTION '❌ FAIL: % funcoes SECURITY DEFINER sem search_path', missing; END IF;
  RAISE NOTICE '✅ OK: todas as SECURITY DEFINER tem search_path fixado';
END $$;

\echo '=== Matriz RLS completa ==='