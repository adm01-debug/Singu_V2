CREATE OR REPLACE FUNCTION public.__diag_multiplix()
 RETURNS TABLE(fn text, veredito text)
 LANGUAGE plpgsql
AS $function$
DECLARE r record; n int;
BEGIN
  FOR r IN SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
           FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
           WHERE ns.nspname='public' AND p.proname LIKE 'multiplix%' ORDER BY 1 LOOP
    fn := r.proname || '(' || r.args || ')';
    BEGIN
      IF r.args = '' THEN
        EXECUTE format('SELECT count(*) FROM public.%I()', r.proname) INTO n;
        veredito := 'OK: ' || n || ' linhas';
      ELSE
        veredito := 'NAO TESTADO (requer argumentos)';
      END IF;
    EXCEPTION WHEN others THEN
      veredito := 'FALHA: ' || SQLERRM || ' | ' || SQLSTATE;
    END;
    RETURN NEXT;
  END LOOP;
END $function$
