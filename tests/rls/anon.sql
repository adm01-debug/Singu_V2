-- Testes RLS — perfil anon (não autenticado)
-- Garante que dados sensíveis NÃO são acessíveis sem autenticação

\echo 'TEST: anon não pode ler contacts'
SET LOCAL ROLE anon;
DO $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.contacts LIMIT 1;
  IF cnt > 0 THEN
    RAISE EXCEPTION '❌ FALHA: anon conseguiu ler % contacts', cnt;
  END IF;
  RAISE NOTICE '✅ OK: anon não vê contacts';
END $$;

\echo 'TEST: anon não pode ler audit_log'
DO $$
DECLARE cnt INT;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.audit_log LIMIT 1;
  IF cnt > 0 THEN
    RAISE EXCEPTION '❌ FALHA: anon conseguiu ler audit_log';
  END IF;
  RAISE NOTICE '✅ OK: anon não vê audit_log';
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

RESET ROLE;
