CREATE OR REPLACE FUNCTION public.get_database_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'checked_at', NOW(),
    'tables', jsonb_build_object(
      'companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'contacts', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'interactions', (SELECT COUNT(*) FROM interactions)
    ),
    'recent_activity', jsonb_build_object(
      'interactions_24h', (SELECT COUNT(*) FROM interactions WHERE created_at >= NOW() - INTERVAL '24 hours'),
      'interactions_7d', (SELECT COUNT(*) FROM interactions WHERE created_at >= NOW() - INTERVAL '7 days')
    ),
    'function_count', (
      SELECT COUNT(*) FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.prokind = 'f'
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
