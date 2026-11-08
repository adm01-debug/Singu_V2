DROP POLICY IF EXISTS cl_service_all ON public.connector_log;
DROP POLICY IF EXISTS ptc_service_all ON zapp_history.phone_to_contact;
DROP POLICY IF EXISTS "Usuarios autenticados podem ver notas" ON _dormant.notes;
