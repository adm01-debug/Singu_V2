-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721194730
-- nome:   fix_remaining_auth_rls_initplan

DROP POLICY IF EXISTS cl_service_all ON public.connector_log;
DROP POLICY IF EXISTS ptc_service_all ON zapp_history.phone_to_contact;
DROP POLICY IF EXISTS "Usuarios autenticados podem ver notas" ON _dormant.notes;
