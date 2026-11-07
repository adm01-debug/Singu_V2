-- check-security-definer-search-path.sql — Auditoria hardening 26/11.
-- Funções SECURITY DEFINER precisam de search_path FIXO começando em pg_catalog.
-- Search_path aberto permite hijack: usuário cria objeto em schema anterior de
-- busca e a função (rodando como owner/role) executa código não intencional
-- (privilege escalation clássico).
-- Na produção auditada, 172/175 funções SECURITY DEFINER usam search_path que
-- começa em 'public' ou variável — candidatas a fix. As 3 seguras seguem o padrão
-- 'search_path=pg_catalog, public'.
-- A função pgbouncer.get_auth (schema pgbouncer) é interna do Supabase e fora do
-- nosso controle — este guard a exclui do DO (o probe abaixo a lista por
-- completude; ignore-a se aparecer).
\echo '== check-security-definer-search-path =='
\pset pager off
\set ON_ERROR_STOP on

-- Probe: função, assinatura e search_path atual de cada SECURITY DEFINER.
SELECT n.nspname || '.' || p.proname AS func,
       pg_get_function_identity_arguments(p.oid) AS args,
       (SELECT string_agg(c, ',') FROM unnest(p.proconfig) c) AS search_path
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE p.prosecdef = true
   AND (p.proconfig IS NULL
        OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c
                        WHERE c LIKE 'search_path=pg_catalog%'))
   AND n.nspname <> 'pgbouncer'
 ORDER BY n.nspname, p.proname;

DO $BODY$
DECLARE
  v_qtd int := 0;
  v_rec record;
  v_det text := '';
BEGIN
  FOR v_rec IN
    SELECT n.nspname || '.' || p.proname AS func
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE p.prosecdef = true
       AND (p.proconfig IS NULL
            OR NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c
                            WHERE c LIKE 'search_path=pg_catalog%'))
       AND n.nspname <> 'pgbouncer'
     ORDER BY n.nspname, p.proname
  LOOP
    v_qtd := v_qtd + 1;
    IF length(v_det) < 4000 THEN
      v_det := v_det || E'\n  - ' || v_rec.func;
    END IF;
  END LOOP;

  IF v_qtd > 0 THEN
    RAISE EXCEPTION 'FATAL: % funcao(oes) SECURITY DEFINER sem search_path comecando em pg_catalog.%',
                    v_qtd, v_det;
  END IF;
  RAISE NOTICE 'OK: todas as SECURITY DEFINER com search_path=pg_catalog...';
END
$BODY$;
\echo 'OK check-security-definer-search-path.'
