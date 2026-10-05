\set ON_ERROR_STOP 1
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '120s';
\i diag/fix.sql
DO $$
DECLARE r record; n int; ok int := 0; bad int := 0; vazio int := 0;
BEGIN
  FOR r IN
    SELECT DISTINCT c.relname
    FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace s ON s.oid = c.relnamespace
    WHERE s.nspname = 'public' AND NOT t.tgisinternal AND c.relkind IN ('r','p')
      AND (t.tgtype & 16) = 16
      AND EXISTS (SELECT 1 FROM information_schema.columns k WHERE k.table_schema='public' AND k.table_name=c.relname AND k.column_name='id')
    ORDER BY 1
  LOOP
    BEGIN
      EXECUTE format('UPDATE public.%I SET id = id WHERE ctid = (SELECT ctid FROM public.%I LIMIT 1)', r.relname, r.relname);
      GET DIAGNOSTICS n = ROW_COUNT;
      IF n = 0 THEN vazio := vazio + 1; ELSE ok := ok + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
      bad := bad + 1;
      RAISE NOTICE 'FALHA UPDATE % : %', r.relname, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'RESUMO: ok=% falhas=% vazias=%', ok, bad, vazio;
END $$;
ROLLBACK;
