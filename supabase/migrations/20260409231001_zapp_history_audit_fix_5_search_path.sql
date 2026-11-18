-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409231001
-- nome:   zapp_history_audit_fix_5_search_path

ALTER FUNCTION zapp_history.calculate_bant_score(UUID) SET search_path = 'zapp_history','public','pg_temp';
ALTER FUNCTION zapp_history.detect_relationship_status(UUID) SET search_path = 'zapp_history','public','pg_temp';
ALTER FUNCTION zapp_history.trg_calculate_lead_score() SET search_path = 'zapp_history','public','pg_temp';

-- Verificar se sobrou alguma sem search_path
SELECT COUNT(*) AS remaining_insecure
FROM pg_proc p
WHERE p.pronamespace = 'zapp_history'::regnamespace
  AND p.prosecdef = TRUE
  AND (p.proconfig IS NULL OR NOT (array_to_string(p.proconfig,',') LIKE '%search_path%'));
