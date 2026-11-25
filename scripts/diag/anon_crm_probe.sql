BEGIN;
SET LOCAL statement_timeout = '60s';
SELECT n.nspname, c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname ~ '^(stg_|dados_dispersos|lalamove)' ORDER BY 1,2;
SELECT p.oid::regprocedure AS fn, pg_get_function_result(p.oid) AS ret, pg_get_function_arguments(p.oid) AS args FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname IN ('search_contacts_advanced','get_contact_360_by_phone','get_contact_intelligence_by_phone','get_companies_by_phones_batch','sync_interaction_from_zapp');
DO $$ DECLARE col text; v text; BEGIN
  SELECT column_name INTO col FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name IN ('whatsapp','phone','telefone','celular') ORDER BY array_position(ARRAY['whatsapp','phone','telefone','celular'], column_name::text) LIMIT 1;
  EXECUTE format('SELECT %I::text FROM public.contacts WHERE %I IS NOT NULL AND length(%I::text) >= 10 LIMIT 1', col, col, col) INTO v;
  PERFORM set_config('diag.phone', coalesce(v,''), true);
  RAISE NOTICE 'coluna=% telefone_encontrado=%', col, v IS NOT NULL;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.probe(label text) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE ph text := current_setting('diag.phone'); res text; q text; calls text[] := ARRAY[
  'SELECT string_agg(length(r::text)::text, '','') FROM (SELECT public.get_contact_360_by_phone($1) r) x',
  'SELECT string_agg(length(r::text)::text, '','') FROM (SELECT public.get_contact_intelligence_by_phone($1) r) x',
  'SELECT string_agg(length(r::text)::text, '','') FROM (SELECT public.get_companies_by_phones_batch(ARRAY[$1]) r) x',
  'SELECT count(*)::text FROM (SELECT public.search_contacts_advanced(NULL::text) r) x'];
BEGIN
  FOREACH q IN ARRAY calls LOOP
    BEGIN
      EXECUTE q INTO res USING ph;
      RAISE NOTICE '[%] % => %', label, substr(q, 50, 45), coalesce(res, 'NULL');
    EXCEPTION WHEN others THEN RAISE NOTICE '[%] % => ERRO % %', label, substr(q, 50, 45), SQLSTATE, SQLERRM;
    END;
  END LOOP;
END $f$;
GRANT EXECUTE ON FUNCTION pg_temp.probe(text) TO anon;
SELECT pg_temp.probe('postgres-atual');
SET LOCAL ROLE anon;
SELECT pg_temp.probe('anon-atual');
RESET ROLE;
\i supabase/migrations/20261006120000_least_privilege_canonical.sql
\i supabase/migrations/20261006120100_storage_buckets_singu.sql
SET LOCAL ROLE anon;
SELECT pg_temp.probe('anon-pos-migration');
RESET ROLE;
ROLLBACK;
