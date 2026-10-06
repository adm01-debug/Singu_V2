-- Testes RLS — perfil anon (não autenticado)
-- Garante que dados sensíveis NÃO são acessíveis sem autenticação.
-- Roda em transação revertida: SET LOCAL ROLE só vale dentro de transação.

BEGIN;
SET LOCAL ROLE anon;

\echo 'TEST: anon não pode ler contacts nem audit_log'
DO $$
DECLARE
  t text;
  cnt int;
BEGIN
  FOREACH t IN ARRAY ARRAY['contacts', 'audit_log'] LOOP
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', t) INTO cnt;
      IF cnt > 0 THEN
        RAISE EXCEPTION '❌ FALHA: anon conseguiu ler % linhas de %', cnt, t;
      END IF;
    EXCEPTION WHEN insufficient_privilege THEN
      NULL;
    END;
  END LOOP;
  RAISE NOTICE '✅ OK: anon não vê contacts nem audit_log';
END $$;

\echo 'TEST: anon não pode inserir em login_attempts'
DO $$
BEGIN
  BEGIN
    INSERT INTO public.login_attempts (email, success) VALUES ('test@test.com', false);
    RAISE EXCEPTION '❌ FALHA: anon conseguiu inserir login_attempt';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    RAISE NOTICE '✅ OK: anon bloqueado em login_attempts';
  END;
END $$;

ROLLBACK;
