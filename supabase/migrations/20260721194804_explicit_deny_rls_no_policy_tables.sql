-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721194804
-- nome:   explicit_deny_rls_no_policy_tables

DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'access_blocked_log','asia_upload_mapping','login_attempts',
    'password_reset_requests','sm_upload_mapping','xbz_upload_mapping'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl
        AND policyname = tbl || '_internal_deny_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated, anon USING (false)',
        tbl || '_internal_deny_all', tbl
      );
    END IF;
  END LOOP;
END $$;
