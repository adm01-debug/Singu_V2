-- RPCs da edge function external-data executadas com o JWT do usuário
-- (20261007100000_external_rpc_user_scope.sql):
--   1) guards assert_* são SECURITY INVOKER, executáveis por authenticated e não por anon;
--   2) o dono passa nos guards e executa RPCs que dependem deles;
--   3) outro usuário autenticado é barrado pelos guards nos dados do dono.
BEGIN;

SELECT set_config('rls.user_b', :'user_b', true);
SELECT set_config('rls.owner', (SELECT id::text FROM public.profiles ORDER BY id LIMIT 1), true);

INSERT INTO public.contacts (first_name, last_name, user_id)
VALUES ('rls', 'external-rpc-fixture', current_setting('rls.owner')::uuid)
RETURNING set_config('rls.contact', id::text, true);

CREATE FUNCTION pg_temp.act_as(_uid text) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claim.sub', _uid, true),
         set_config('request.jwt.claims', json_build_object('sub', _uid, 'role', 'authenticated')::text, true);
$$;

\echo 'TEST: guards assert_* executáveis por authenticated, nunca por anon'
DO $$
DECLARE bad text;
BEGIN
  SELECT string_agg(p.oid::regprocedure::text, ', ') INTO bad
  FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace
    AND p.proname LIKE 'assert\_%'
    AND (p.prosecdef
         OR NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
         OR has_function_privilege('anon', p.oid, 'EXECUTE'));
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'guard(s) assert_* fora do contrato: %', bad;
  END IF;
  IF to_regprocedure('public.get_instant_kpis(uuid)') IS NOT NULL AND (
       (SELECT prosecdef FROM pg_proc WHERE oid = 'public.get_instant_kpis(uuid)'::regprocedure)
       OR NOT has_function_privilege('authenticated', 'public.get_instant_kpis(uuid)', 'EXECUTE')
       OR has_function_privilege('anon', 'public.get_instant_kpis(uuid)', 'EXECUTE')) THEN
    RAISE EXCEPTION 'get_instant_kpis deve ser SECURITY INVOKER e executável só por authenticated';
  END IF;
END $$;

\echo 'TEST: dono passa nos guards'
SELECT pg_temp.act_as(current_setting('rls.owner'));
SET LOCAL ROLE authenticated;
SELECT public.assert_self_user_id(current_setting('rls.owner')::uuid);
SELECT public.assert_contact_access(current_setting('rls.contact')::uuid);
SELECT public.get_instant_kpis(current_setting('rls.owner')::uuid) IS NOT NULL AS kpis_ok;
RESET ROLE;

\echo 'TEST: outro usuário é barrado nos dados do dono'
SELECT pg_temp.act_as(current_setting('rls.user_b'));
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  calls text[] := ARRAY[
    format('SELECT public.assert_self_user_id(%L::uuid)', current_setting('rls.owner')),
    format('SELECT public.assert_contact_access(%L::uuid)', current_setting('rls.contact'))
  ];
  q text;
BEGIN
  FOREACH q IN ARRAY calls LOOP
    BEGIN
      EXECUTE q;
      RAISE EXCEPTION 'guard não barrou outro usuário: %', q;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
  END LOOP;
END $$;
RESET ROLE;

ROLLBACK;
