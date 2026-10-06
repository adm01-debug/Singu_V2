-- Rodada 49/10 · Invariantes para SECURITY DEFINER em public.*
--   1) search_path travado em TODO DEFINER
--   2) DEFINER exposto a `anon` NUNCA pode usar auth.uid() (padrão inseguro:
--      anon sem JWT resulta em auth.uid() = NULL e escreve linhas órfãs)
--   3) Baseline: 96 DEFINERs (ajuste consciente aqui + docs/qa/security-definer-audit.md)

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
           p.prosrc,
           has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec
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

    IF r.anon_exec AND position('auth.uid()' in r.prosrc) > 0 THEN
      uses_authuid := uses_authuid || r.sig;
    END IF;
  END LOOP;

  IF array_length(bad_searchpath, 1) > 0 THEN
    RAISE EXCEPTION 'DEFINER sem search_path travado: %', bad_searchpath;
  END IF;

  IF array_length(uses_authuid, 1) > 0 THEN
    RAISE EXCEPTION 'DEFINER exposto a anon usando auth.uid() (padrão inseguro): %', uses_authuid;
  END IF;

  IF total <> 96 THEN
    RAISE EXCEPTION 'baseline DEFINER esperado = 96; atual = %. Atualize docs/qa/security-definer-audit.md se intencional.', total;
  END IF;

  RAISE NOTICE 'OK — 96/96 DEFINERs conformes (search_path pinned; nenhum exposto a anon usa auth.uid()).';
END $$;

ROLLBACK;