-- Rodada 49/10 · Invariantes para SECURITY DEFINER em public.*
-- 1) search_path travado; 2) sem auth.uid() no corpo; 3) baseline de 5 funções.

BEGIN;

DO $$
DECLARE
  r record;
  bad_searchpath text[] := ARRAY[]::text[];
  uses_authuid   text[] := ARRAY[]::text[];
  total int := 0;
BEGIN
  FOR r IN
    SELECT p.oid,
           p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS sig,
           p.proconfig,
           p.prosrc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.prosecdef
  LOOP
    total := total + 1;

    IF r.proconfig IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM unnest(r.proconfig) c
         WHERE c ILIKE 'search_path=%'
       ) THEN
      bad_searchpath := bad_searchpath || r.sig;
    END IF;

    IF position('auth.uid()' in r.prosrc) > 0 THEN
      uses_authuid := uses_authuid || r.sig;
    END IF;
  END LOOP;

  IF array_length(bad_searchpath, 1) > 0 THEN
    RAISE EXCEPTION 'DEFINER sem search_path travado: %', bad_searchpath;
  END IF;

  IF array_length(uses_authuid, 1) > 0 THEN
    RAISE EXCEPTION 'DEFINER usando auth.uid() (padrão inseguro em endpoint público): %', uses_authuid;
  END IF;

  IF total <> 5 THEN
    RAISE EXCEPTION 'baseline DEFINER esperado = 5; atual = %. Atualize docs/qa/security-definer-audit.md se intencional.', total;
  END IF;

  RAISE NOTICE 'OK — 5/5 DEFINERs conformes (search_path pinned, sem auth.uid()).';
END $$;

ROLLBACK;