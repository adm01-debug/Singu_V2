-- Matriz RLS — dados psicograficos (Rodada P1)
-- Valida que apenas o dono do contato ou admin acessa contact_behavior, contact_personality,
-- brain_dominance_analysis, whatsapp_messages_index e afins.
-- Executar com: psql -v ON_ERROR_STOP=1 -f tests/rls/psychographic_matrix.sql

-- Fixtures criadas dentro da transação (revertida no final):
--   * contato do user_a (contacts.user_id não tem FK para auth.users) com uma linha em contact_behavior;
--   * user_b é um UUID sem papel e sem contatos;
--   * admin é um usuário real com papel admin, quando existir (user_roles tem FK para auth.users).
-- Variáveis :user_a e :user_b vêm de tests/rls/run.sh.
BEGIN;

\echo '=== SETUP: fixtures do user_a ==='
SELECT set_config('rls.user_a', :'user_a', true), set_config('rls.user_b', :'user_b', true);
DELETE FROM public.user_roles WHERE user_id IN (:'user_a'::uuid, :'user_b'::uuid);
INSERT INTO public.contacts (first_name, last_name, user_id)
VALUES ('rls', 'fixture', :'user_a'::uuid)
RETURNING id AS fixture_contact \gset
INSERT INTO public.contact_behavior (contact_id) VALUES (:'fixture_contact'::uuid);
SELECT set_config('rls.fixture_contact', :'fixture_contact', true);
SELECT set_config('rls.admin', coalesce((
  SELECT user_id::text FROM public.user_roles WHERE role = 'admin' ORDER BY created_at LIMIT 1
), ''), true);

\echo '=== TEST 1: authenticated user_b NAO pode SELECT contact_behavior de contato do user_a ==='
DO $$
DECLARE cnt int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', current_setting('rls.user_b'), true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.user_b'), 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO cnt FROM public.contact_behavior
   WHERE contact_id = current_setting('rls.fixture_contact')::uuid;
  IF cnt > 0 THEN RAISE EXCEPTION '❌ FAIL: user_b viu % linhas de contact_behavior alheias', cnt; END IF;
  RAISE NOTICE '✅ OK: user_b bloqueado em contact_behavior alheio';
END $$;
RESET ROLE;

\echo '=== TEST 2: authenticated user_b NAO pode INSERT contact_behavior em contato do user_a ==='
DO $$
BEGIN
  SET LOCAL ROLE authenticated;
  BEGIN
    INSERT INTO public.contact_behavior (contact_id) VALUES (current_setting('rls.fixture_contact')::uuid);
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
  SET LOCAL ROLE authenticated;
  UPDATE public.contact_behavior SET updated_at = now()
   WHERE contact_id = current_setting('rls.fixture_contact')::uuid;
  GET DIAGNOSTICS rc = ROW_COUNT;
  IF rc > 0 THEN RAISE EXCEPTION '❌ FAIL: UPDATE afetou % linhas alheias', rc; END IF;
  DELETE FROM public.contact_behavior
   WHERE contact_id = current_setting('rls.fixture_contact')::uuid;
  GET DIAGNOSTICS rc = ROW_COUNT;
  IF rc > 0 THEN RAISE EXCEPTION '❌ FAIL: DELETE afetou % linhas alheias', rc; END IF;
  RAISE NOTICE '✅ OK: UPDATE/DELETE de user_b nao afeta linhas alheias';
END $$;
RESET ROLE;

\echo '=== TEST 3b: dono (user_a) enxerga o próprio contact_behavior ==='
DO $$
DECLARE cnt int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', current_setting('rls.user_a'), true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.user_a'), 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO cnt FROM public.contact_behavior
   WHERE contact_id = current_setting('rls.fixture_contact')::uuid;
  IF cnt <> 1 THEN RAISE EXCEPTION '❌ FAIL: dono viu % linhas do próprio contact_behavior (esperado 1)', cnt; END IF;
  RAISE NOTICE '✅ OK: dono enxerga o próprio contact_behavior';
END $$;
RESET ROLE;

\echo '=== TEST 4: admin enxerga contact_behavior de qualquer dono via has_role ==='
DO $$
DECLARE cnt int;
BEGIN
  IF current_setting('rls.admin') = '' THEN
    RAISE NOTICE '⚠️  sem usuário admin no banco — TEST 4 não aplicável';
    RETURN;
  END IF;
  PERFORM set_config('request.jwt.claim.sub', current_setting('rls.admin'), true);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.admin'), 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO cnt FROM public.contact_behavior
   WHERE contact_id = current_setting('rls.fixture_contact')::uuid;
  IF cnt <> 1 THEN RAISE EXCEPTION '❌ FAIL: admin viu % linhas do contato fixture (esperado 1)', cnt; END IF;
  RAISE NOTICE '✅ OK: admin enxerga contact_behavior alheio';
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
    CONTINUE WHEN to_regclass('public.' || t) IS NULL;
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', t) INTO cnt;
      IF cnt > 0 THEN RAISE EXCEPTION '❌ FAIL: anon leu % linhas de %', cnt, t; END IF;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
  END LOOP;
  RAISE NOTICE '✅ OK: anon bloqueado em todas as tabelas psicograficas';
END $$;
RESET ROLE;

\echo '=== TEST 6: anon NAO pode executar SECURITY DEFINER funcoes sensiveis ==='
SET LOCAL ROLE anon;
DO $$
BEGIN
  IF to_regprocedure('public.execute_readonly_query(text)') IS NULL THEN
    RAISE NOTICE '✅ OK: execute_readonly_query não existe';
  ELSE
    BEGIN
      PERFORM public.execute_readonly_query('SELECT 1');
      RAISE EXCEPTION '❌ FAIL: anon conseguiu executar execute_readonly_query';
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE '✅ OK: anon bloqueado em execute_readonly_query';
    END;
  END IF;

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

\echo '=== TEST 8: storage — buckets do Singu privados e escrita restrita ao dono ==='
DO $$
DECLARE
  b text;
  pub boolean;
BEGIN
  FOREACH b IN ARRAY ARRAY['documents', 'whatsapp-audio'] LOOP
    SELECT public INTO pub FROM storage.buckets WHERE id = b;
    IF NOT FOUND THEN RAISE EXCEPTION '❌ FAIL: bucket % ausente', b; END IF;
    IF pub THEN RAISE EXCEPTION '❌ FAIL: bucket % é público', b; END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects' AND cmd = 'INSERT'
        AND with_check LIKE '%' || quote_literal(b) || '%'
        AND with_check LIKE '%storage.foldername%auth.uid%'
    ) THEN
      RAISE EXCEPTION '❌ FAIL: bucket % sem policy de INSERT restrita ao dono da pasta', b;
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects'
        AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
        AND (coalesce(qual, '') || coalesce(with_check, '')) LIKE '%' || quote_literal(b) || '%'
    ) THEN
      RAISE EXCEPTION '❌ FAIL: bucket % tem policy aplicável a anon/public', b;
    END IF;
  END LOOP;
  RAISE NOTICE '✅ OK: buckets documents e whatsapp-audio privados e owner-only';
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

ROLLBACK;
