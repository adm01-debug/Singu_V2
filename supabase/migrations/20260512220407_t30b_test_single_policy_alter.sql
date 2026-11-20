-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260512220407
-- nome:   t30b_test_single_policy_alter

DO $do$
BEGIN
  IF to_regclass('_dormant.automation_logs') IS NOT NULL THEN
ALTER POLICY "Users can view their own automation logs" ON _dormant.automation_logs
  USING (((SELECT auth.uid()) = user_id));
  ELSE
    RAISE NOTICE 'skip: _dormant.automation_logs nao existe (automation_logs ficou em public)';
  END IF;
END $do$;
