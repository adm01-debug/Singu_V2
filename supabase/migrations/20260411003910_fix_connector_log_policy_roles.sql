-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260411003910
-- nome:   fix_connector_log_policy_roles

DROP POLICY IF EXISTS cl_admin_read ON public.connector_log;
CREATE POLICY cl_admin_read ON public.connector_log
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid()));

DROP POLICY IF EXISTS cl_service_all ON public.connector_log;
CREATE POLICY cl_service_all ON public.connector_log
  AS PERMISSIVE FOR ALL TO service_role
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);
