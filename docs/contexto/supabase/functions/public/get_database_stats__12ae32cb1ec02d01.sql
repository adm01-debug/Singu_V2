CREATE OR REPLACE FUNCTION public.get_database_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  v_result := jsonb_build_object(
    'tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
    'views', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'VIEW'),
    'functions', (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f'),
    'companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
    'contacts', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
    'interactions', (SELECT COUNT(*) FROM interactions),
    'collected_at', NOW()
  );
  
  RETURN v_result;
END;
$function$
