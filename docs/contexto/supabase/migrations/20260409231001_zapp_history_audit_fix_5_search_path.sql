ALTER FUNCTION zapp_history.calculate_bant_score(UUID) SET search_path = 'zapp_history','public','pg_temp';
ALTER FUNCTION zapp_history.detect_relationship_status(UUID) SET search_path = 'zapp_history','public','pg_temp';
ALTER FUNCTION zapp_history.trg_calculate_lead_score() SET search_path = 'zapp_history','public','pg_temp';

-- Verificar se sobrou alguma sem search_path
SELECT COUNT(*) AS remaining_insecure
FROM pg_proc p
WHERE p.pronamespace = 'zapp_history'::regnamespace
  AND p.prosecdef = TRUE
  AND (p.proconfig IS NULL OR NOT (array_to_string(p.proconfig,',') LIKE '%search_path%'));
