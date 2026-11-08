-- UP MIGRATION: restringe fontes legadas ao contato ativo e ao administrador com MFA.
DO $scope$
DECLARE
  relation_table text;
  guard text;
BEGIN
  FOREACH relation_table IN ARRAY ARRAY['contact_emails', 'contact_phones'] LOOP
    IF to_regclass(format('public.%I', relation_table)) IS NULL THEN
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_class
      WHERE oid = format('public.%I', relation_table)::regclass AND relrowsecurity
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', relation_table);
    END IF;
    guard := format(
      '(EXISTS (SELECT 1 FROM public.contacts c
          WHERE c.id = %1$I.contact_id AND c.deleted_at IS NULL
            AND c.user_id = (SELECT auth.uid())))
        OR ((SELECT public.has_role(auth.uid(), ''admin''::public.app_role))
          AND (SELECT auth.jwt() ->> ''aal'') = ''aal2'')',
      relation_table
    );
    EXECUTE format('DROP POLICY IF EXISTS dashboard_contact_owner_scope ON public.%I', relation_table);
    EXECUTE format('DROP POLICY IF EXISTS contact_relation_active_owner_or_admin ON public.%I', relation_table);
    EXECUTE format(
      'CREATE POLICY contact_relation_active_owner_or_admin ON public.%I AS RESTRICTIVE
       FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',
      relation_table, guard, guard
    );
  END LOOP;
  IF to_regclass('public.contact_phones') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contact_phones'
      AND policyname = 'contact_phones_owner_access'
  ) THEN
    CREATE POLICY contact_phones_owner_access ON public.contact_phones
      FOR ALL TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.contacts c
        WHERE c.id = contact_phones.contact_id AND c.user_id = (SELECT auth.uid())
          AND c.deleted_at IS NULL
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.contacts c
        WHERE c.id = contact_phones.contact_id AND c.user_id = (SELECT auth.uid())
          AND c.deleted_at IS NULL
      ));
  END IF;
END;
$scope$;

-- DOWN MIGRATION: restaura o escopo do dashboard nas tabelas reconstruídas;
-- nas tabelas legadas, voltam a valer as policies antigas, inclusive o acesso amplo a emails.
-- DO $restore$
-- DECLARE
--   relation_table text;
--   guard text;
-- BEGIN
--   FOREACH relation_table IN ARRAY ARRAY['contact_emails', 'contact_phones'] LOOP
--     IF to_regclass(format('public.%I', relation_table)) IS NULL THEN CONTINUE; END IF;
--     IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
--       AND tablename = relation_table AND policyname = 'dashboard_contact_owner_write')
--       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
--         AND tablename = relation_table AND policyname = 'dashboard_contact_owner_scope') THEN
--       guard := format('EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = %I.contact_id
--         AND c.user_id = (SELECT auth.uid()) AND c.deleted_at IS NULL)', relation_table);
--       EXECUTE format('CREATE POLICY dashboard_contact_owner_scope ON public.%I AS RESTRICTIVE
--         FOR ALL TO authenticated USING (%s) WITH CHECK (%s)', relation_table, guard, guard);
--     END IF;
--     EXECUTE format('DROP POLICY IF EXISTS contact_relation_active_owner_or_admin ON public.%I', relation_table);
--   END LOOP;
--   IF to_regclass('public.contact_phones') IS NOT NULL THEN
--     DROP POLICY IF EXISTS contact_phones_owner_access ON public.contact_phones;
--   END IF;
-- END;
-- $restore$;
