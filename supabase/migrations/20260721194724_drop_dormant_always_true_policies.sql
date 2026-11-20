-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721194724
-- nome:   drop_dormant_always_true_policies

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = '_dormant'
      AND (
        (qual      IS NOT NULL AND trim(qual)        = 'true')
        OR
        (with_check IS NOT NULL AND trim(with_check) = 'true')
      )
    ORDER BY tablename, policyname
  LOOP
    BEGIN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON _dormant.%I',
        p.policyname, p.tablename
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not drop policy % on _dormant.%: %',
          p.policyname, p.tablename, SQLERRM;
    END;
  END LOOP;
END $$;
