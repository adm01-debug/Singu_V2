-- function-search-path-reset-audit.sql — Rodada 19/10
-- Functions SECURITY DEFINER sem SET search_path fixo sao vetor de escalonamento.
-- Rodada 23/10 (F2): tambem falha se search_path fixo comeca por schema
-- gravavel por outros (ex: 'public'), permitindo hijack de objetos.
\echo '== function-search-path-reset-audit =='
WITH sd AS (
  SELECT n.nspname, p.proname, p.proconfig,
         (SELECT split_part(cfg, '=', 2)
            FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
           WHERE split_part(cfg,'=',1)='search_path'
           LIMIT 1) AS sp
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.prosecdef = true
)
SELECT nspname, proname, sp,
       CASE
         WHEN sp IS NULL                          THEN 'missing'
         WHEN sp = ''''''                         THEN 'ok-empty'
         WHEN sp ILIKE 'pg_catalog%'              THEN 'ok'
         ELSE 'insecure-prefix'
       END AS status
  FROM sd
 ORDER BY status, nspname, proname;
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM (
    SELECT (SELECT split_part(cfg,'=',2)
              FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
             WHERE split_part(cfg,'=',1)='search_path' LIMIT 1) AS sp
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname='public' AND p.prosecdef=true
  ) x
  WHERE sp IS NULL
     OR (sp <> '''''' AND sp NOT ILIKE 'pg_catalog%');
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % functions SECDEF sem search_path seguro (vazio ou pg_catalog first).', v_count;
  END IF;
END $$;
\echo 'OK todas SECURITY DEFINER com search_path seguro.'