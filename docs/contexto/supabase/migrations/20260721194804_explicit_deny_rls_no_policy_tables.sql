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
