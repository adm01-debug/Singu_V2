DROP POLICY IF EXISTS cl_admin_read ON public.connector_log;
CREATE POLICY cl_admin_read ON public.connector_log
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid()));

DROP POLICY IF EXISTS cl_service_all ON public.connector_log;
CREATE POLICY cl_service_all ON public.connector_log
  AS PERMISSIVE FOR ALL TO service_role
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);
