-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260425172007
-- nome:   add_status_enum_webhook_events_does_not_apply_here

-- Esta migration é projeto Gestão de Clientes, mas a tabela está em FATOR X
-- (project_id tdprnylgyrogbbhgdoik). Vou rodar via execute_sql no projeto correto.
SELECT 1;
