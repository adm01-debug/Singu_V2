-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260410160640
-- nome:   harden_views_security_invoker_all

DO $$
DECLARE
  v record;
  cnt int := 0;
BEGIN
  FOR v IN
    SELECT n.nspname, c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'
      AND n.nspname = 'public'
  LOOP
    EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = on)', v.nspname, v.relname);
    cnt := cnt + 1;
  END LOOP;
  RAISE NOTICE 'Views convertidas para SECURITY INVOKER: %', cnt;
END $$;
