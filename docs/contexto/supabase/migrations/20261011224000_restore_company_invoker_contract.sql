-- UP MIGRATION: compatibilidade do cadastro composto com o schema legado de empresas.
DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc
    WHERE oid = to_regprocedure('public.has_role(uuid,public.app_role)') AND NOT prosecdef) THEN
    ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY DEFINER;
    ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = pg_catalog, public;
    REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
  END IF;
  IF to_regprocedure('public.immutable_unaccent(text)') IS NOT NULL
    AND NOT has_function_privilege('authenticated', 'public.immutable_unaccent(text)', 'EXECUTE') THEN
    GRANT EXECUTE ON FUNCTION public.immutable_unaccent(text) TO authenticated;
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.companies', 'SELECT')
    OR NOT has_table_privilege('authenticated', 'public.companies', 'INSERT')
    OR NOT has_table_privilege('authenticated', 'public.companies', 'UPDATE')
    OR NOT has_table_privilege('authenticated', 'public.companies', 'DELETE') THEN
    ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS singu_company_invoker_scope ON public.companies;
    CREATE POLICY singu_company_invoker_scope ON public.companies AS RESTRICTIVE
      FOR ALL TO authenticated USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));
    DROP POLICY IF EXISTS singu_company_invoker_owner ON public.companies;
    CREATE POLICY singu_company_invoker_owner ON public.companies
      FOR ALL TO authenticated USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.companies'::regclass AND attname = 'name'
      AND NOT attisdropped AND attgenerated = '') THEN
    EXECUTE $ddl$
      CREATE OR REPLACE FUNCTION public.singu_sync_legacy_company_name() RETURNS trigger
      LANGUAGE plpgsql SET search_path = pg_catalog, public AS $body$
      BEGIN
        IF TG_OP = 'UPDATE' AND NEW.name IS DISTINCT FROM OLD.name
          AND NEW.nome_crm IS NOT DISTINCT FROM OLD.nome_crm THEN
          NEW.nome_crm := NEW.name;
        ELSE
          NEW.name := COALESCE(NEW.nome_crm, NEW.name);
          NEW.nome_crm := COALESCE(NEW.nome_crm, NEW.name);
        END IF;
        RETURN NEW;
      END;
      $body$;
    $ddl$;
    REVOKE EXECUTE ON FUNCTION public.singu_sync_legacy_company_name() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.singu_sync_legacy_company_name() TO service_role;
    DROP TRIGGER IF EXISTS a_singu_sync_legacy_company_name ON public.companies;
    CREATE TRIGGER a_singu_sync_legacy_company_name BEFORE INSERT OR UPDATE
      ON public.companies FOR EACH ROW EXECUTE FUNCTION public.singu_sync_legacy_company_name();
  END IF;
END;
$migration$;

-- DOWN MIGRATION (Rollback): somente nas bases legadas alteradas por esta migration.
-- Nenhum objeto do canônico sem a coluna name é alterado.
-- DROP TRIGGER IF EXISTS a_singu_sync_legacy_company_name ON public.companies;
-- DROP FUNCTION IF EXISTS public.singu_sync_legacy_company_name();
-- Se os grants foram criados aqui, revogá-los antes de remover as policies:
-- REVOKE SELECT, INSERT, UPDATE, DELETE ON public.companies FROM authenticated;
-- DROP POLICY IF EXISTS singu_company_invoker_scope ON public.companies;
-- DROP POLICY IF EXISTS singu_company_invoker_owner ON public.companies;
-- Se EXECUTE foi criado aqui, REVOKE EXECUTE ON FUNCTION public.immutable_unaccent(text) FROM authenticated;
-- Se has_role foi alterado aqui, ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
