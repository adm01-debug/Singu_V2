-- Rodada 53/10 — Invariante: ai_gateway_metrics é admin-only via RPC e service-role no INSERT.
-- Bloqueia leitura direta por anon/authenticated e garante que a RPC exige role 'admin'.
SELECT (to_regclass('public.ai_gateway_metrics') IS NOT NULL AND to_regprocedure('public.get_ai_gateway_health(integer)') IS NOT NULL) AS rls_target_present \gset
\if :rls_target_present

BEGIN;

-- 1) Nenhum GRANT direto de SELECT/INSERT/UPDATE/DELETE em ai_gateway_metrics para anon/authenticated
DO $$
DECLARE
  _count int;
BEGIN
  SELECT count(*) INTO _count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'ai_gateway_metrics'
    AND grantee IN ('anon', 'authenticated')
    AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER');

  IF _count > 0 THEN
    RAISE EXCEPTION 'INVARIANT VIOLATED: ai_gateway_metrics tem % grants para anon/authenticated (esperado 0)', _count;
  END IF;
END $$;

-- 2) RLS habilitado
DO $$
DECLARE
  _enabled boolean;
BEGIN
  SELECT relrowsecurity INTO _enabled
  FROM pg_class WHERE oid = 'public.ai_gateway_metrics'::regclass;

  IF NOT _enabled THEN
    RAISE EXCEPTION 'INVARIANT VIOLATED: RLS desabilitado em ai_gateway_metrics';
  END IF;
END $$;

-- 3) anon NÃO pode executar get_ai_gateway_health
DO $$
DECLARE
  _has boolean;
BEGIN
  SELECT bool_or(has_function_privilege('anon', 'public.get_ai_gateway_health(integer)', 'EXECUTE'))
  INTO _has;

  IF _has THEN
    RAISE EXCEPTION 'INVARIANT VIOLATED: anon pode executar get_ai_gateway_health';
  END IF;
END $$;

-- 4) authenticated PODE executar (mas a função valida admin internamente)
DO $$
BEGIN
  IF NOT has_function_privilege('authenticated', 'public.get_ai_gateway_health(integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'INVARIANT VIOLATED: authenticated não pode executar get_ai_gateway_health';
  END IF;
END $$;

-- 5) A RPC exige has_role(auth.uid(),'admin')
DO $$
DECLARE
  _src text;
BEGIN
  SELECT prosrc INTO _src FROM pg_proc
  WHERE oid = 'public.get_ai_gateway_health(integer)'::regprocedure;

  IF _src NOT LIKE '%has_role(auth.uid(), ''admin'')%' THEN
    RAISE EXCEPTION 'INVARIANT VIOLATED: get_ai_gateway_health não valida role admin';
  END IF;
END $$;

SELECT 'ai_gateway_metrics_least_privilege: OK' AS status;

ROLLBACK;
\else
\echo 'SKIP: public.ai_gateway_metrics / get_ai_gateway_health(integer) ausente no banco alvo'
\endif
