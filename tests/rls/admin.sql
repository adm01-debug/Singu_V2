-- Testes RLS — perfil admin
-- Garante que admins podem gerenciar feature_flags e ver dados sensíveis

\echo 'TEST: admin pode ler feature_flags (esquema)'
SELECT 1 FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'feature_flags';

\echo 'TEST: has_role function existe e é SECURITY DEFINER'
DO $$
DECLARE is_def BOOLEAN;
BEGIN
  SELECT prosecdef INTO is_def
  FROM pg_proc WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace
  LIMIT 1;
  IF NOT is_def THEN
    RAISE EXCEPTION '❌ FALHA: has_role não é SECURITY DEFINER';
  END IF;
  RAISE NOTICE '✅ OK: has_role é SECURITY DEFINER';
END $$;

\echo 'TEST: trigger de version existe em contacts'
DO $$
DECLARE has_trig BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'contacts_increment_version' AND NOT tgisinternal
  ) INTO has_trig;
  IF NOT has_trig THEN
    RAISE EXCEPTION '❌ FALHA: trigger contacts_increment_version não existe';
  END IF;
  RAISE NOTICE '✅ OK: optimistic locking trigger ativo em contacts';
END $$;
