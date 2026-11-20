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
--
-- NOTA DE CORRECAO (replay fiel em banco fresco, role postgres):
-- o DROP do schema _dormant (policy em notes) referenciava tabela que num
-- banco novo ja nao existe mais no _dormant. Convertido para guarda
-- to_regclass, mesmo padrao da gêmea 20260721000046.

DROP POLICY IF EXISTS cl_service_all ON public.connector_log;
DROP POLICY IF EXISTS ptc_service_all ON zapp_history.phone_to_contact;

DO $migration$
DECLARE
  policy_definition record;
BEGIN
  FOR policy_definition IN
    SELECT *
    FROM (VALUES
      ('_dormant', 'notes', 'Usuarios autenticados podem ver notas')
    ) AS policies(schema_name, table_name, policy_name)
  LOOP
    IF to_regclass(format('%I.%I', policy_definition.schema_name, policy_definition.table_name)) IS NOT NULL THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON %I.%I',
        policy_definition.policy_name,
        policy_definition.schema_name,
        policy_definition.table_name
      );
    END IF;
  END LOOP;
END;
$migration$;