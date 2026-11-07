-- Auditoria de cobertura RLS (supabase/tests/check-rls-coverage.sql)
--
-- Como rodar (precisa de leitura de pg_catalog / has_table_privilege):
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/check-rls-coverage.sql
-- Roda em transação com ROLLBACK no fim — não deixa resíduo.
--
-- Contrato da auditoria (falha = RAISE EXCEPTION; sucesso = RAISE NOTICE):
--   1. Nenhuma tabela do schema public (não-partição) pode existir sem RLS.
--   2. Nenhuma política de ESCRITA (INSERT/UPDATE/DELETE/ALL) pode incluir
--      a role anon com guarda que não seja deny explícito (qual/with_check = false),
--      exceto a allow-list intencional (landing page pública).
--   3. Nenhuma política SELECT/ALL com role {public} e qual 'true'/null
--      (leitura integral) se existir GRANT de SELECT a anon ou authenticated
--      — gap inter-tenant (ex.: pipeline_stage_transitions).
--   4. Intencionais preservados: deny-alls internos e leituras públicas por
--      is_published (forms/lead_magnets). Regressão.

BEGIN;

-- ---------------------------------------------------------------------------
-- Regra 1: tabelas do schema public sem RLS
-- --------------------------------------------------------------------------
DO $$
DECLARE
  v_bad text := '';
  v_rec record;
BEGIN
  FOR v_rec IN
    SELECT m.nspname || '.' || c.relname AS t
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
      AND NOT c.relispartition
      AND NOT c.relrowsecurity
    ORDER BY t
  LOOP
    v_bad := v_bad || E'\n  - ' || v_rec.t || ' sem RLS';
  END LOOP;
  IF v_bad <> '' THEN
    RAISE EXCEPTION 'RLS coverage: tabelas sem Row Level Security:%', v_bad;
  END IF;
  RAISE NOTICE 'Regra 1 OK: toda tabela public (não-partição) tem RLS';
END $$;

-- --------------------------------------------------------------------------
-- Regra 2: escrita com role anon sem deny explícito (fora da allow-list)
-- --------------------------------------------------------------------------
DO $$
DECLARE
  v_bad text := '';
  v_rec record;
  v_g text;
BEGIN
  FOR v_rec IN
    SELECT p.schemaname || '.' || p.tablename AS t, p.policyname AS pol,
           COALESCE(p.with_check::text, p.qual::text, '') AS guarda
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.cmd IN ('INSERT','UPDATE','DELETE','ALL')
      AND p.roles::text LIKE '%anon%'
      AND p.permissive = 'PERMISSIVE'
      AND p.tablename <> 'landing_page_submissions'
      AND COALESCE(trim(COALESCE(p.with_check::text, p.qual::text, '')), '') <> 'false'
    ORDER BY 1, 2
  LOOP
    v_g := coalesce(trim(nullif(v_rec.guarda,'')), '<nulo>');
    v_bad := v_bad || format(E'\n  - %s "%s" guarda=%s', v_rec.t, v_rec.pol, v_g);
  END LOOP;
  IF v_bad <> '' THEN
    RAISE EXCEPTION 'RLS coverage: política de escrita com anon sem deny explícito:%', v_bad;
  END IF;
  RAISE NOTICE 'Regra 2 OK: escritas com anon só negadas explicitamente ou intencionais (landing page)';
END $$;

-- ---------------------------------------------------------------------------
-- Regra 3: SELECT/ALL role {public}, qual 'true'/null, + GRANT p/ anon/auth
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_bad text := '';
  v_rec record;
BEGIN
  FOR v_rec IN
    SELECT p.schemaname, p.tablename, p.policyname AS pol, p.cmd,
           p.qual::text AS qual_text
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.cmd IN ('SELECT','ALL')
      AND p.roles::text LIKE '%public%'
      AND p.permissive = 'PERMISSIVE'
      AND (p.qual IS NULL OR trim(p.qual::text) = 'true')
    ORDER BY p.tablename, p.policyname
  LOOP
    IF has_table_privilege('anon', quote_ident(v_rec.schemaname) || '.' || quote_ident(v_rec.tablename), 'SELECT')
       OR has_table_privilege('authenticated', quote_ident(v_rec.schemaname) || '.' || quote_ident(v_rec.tablename), 'SELECT') THEN
      v_bad := v_bad || format(E'\n  - %s.%s "%s" (%s) qual=%s', v_rec.schemaname, v_rec.tablename, v_rec.pol, v_rec.cmd, coalesce(trim(v_rec.qual_text),'<nulo>'));
    END IF;
  END LOOP;
  IF v_bad <> '' THEN
    RAISE EXCEPTION 'RLS coverage: leitura integral via role public com GRANT p/ anon ou authenticated:%', v_bad;
  END IF;
  RAISE NOTICE 'Regra 3 OK: nenhuma leitura integral via role public com GRANT p/ anon|authenticated';
END $$;

-- ---------------------------------------------------------------------------
-- Regra 4: intencionais preservados (regressão)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_deny int;
  v_pub int;
BEGIN
  SELECT count(*) INTO v_deny
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE '%_internal_deny_all'
    AND roles::text LIKE '%anon%'
    AND COALESCE(trim(COALESCE(with_check::text, qual::text, '')), '') = 'false';

  IF v_deny < 6 THEN
    RAISE EXCEPTION 'RLS coverage: esperadas >=6 deny-alls internos com anon, encontrados %', v_deny;
  END IF;

  SELECT count(*) INTO v_pub
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('forms','lead_magnets')
    AND roles::text LIKE '%public%'
    AND COALESCE(qual::text,'') ILIKE '%is_published%';

  IF v_pub < 2 THEN
    RAISE EXCEPTION 'RLS coverage: esperadas leituras públicas por is_published (forms/lead_magnets), encontradas %', v_pub;
  END IF;

  RAISE NOTICE 'Regra 4 OK: % deny-alls internos e % leituras públicas por is_published preservados', v_deny, v_pub;
END $$;

RAISE NOTICE 'check-rls-coverage: todos os asserts passaram';

ROLLBACK;