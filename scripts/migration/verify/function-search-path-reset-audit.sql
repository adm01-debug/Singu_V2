-- function-search-path-reset-audit.sql — Rodada 19/10
-- Functions SECURITY DEFINER sem SET search_path fixo sao vetor de escalonamento.
\echo '== function-search-path-reset-audit =='
SELECT n.nspname, p.proname,
       p.prosecdef AS security_definer,
       p.proconfig AS config
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
 WHERE n.nspname = 'public'
   AND p.prosecdef = true
   AND (p.proconfig IS NULL OR NOT ('search_path' = ANY(
     SELECT split_part(cfg, '=', 1) FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
   )))
 ORDER BY 1,2;
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.prosecdef = true
     AND (p.proconfig IS NULL OR NOT ('search_path' = ANY(
       SELECT split_part(cfg, '=', 1) FROM unnest(COALESCE(p.proconfig, ARRAY[]::text[])) cfg
     )));
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % functions SECURITY DEFINER sem SET search_path fixo.', v_count;
  END IF;
END $$;
\echo 'OK todas SECURITY DEFINER com search_path fixo.'