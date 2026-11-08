CREATE OR REPLACE FUNCTION public.system_health_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'status', 'healthy',
    'timestamp', NOW(),
    'database', jsonb_build_object(
      'functions', (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f'),
      'tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'),
      'triggers', (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public'),
      'indexes', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public')
    ),
    'data', jsonb_build_object(
      'companies', (SELECT COUNT(*) FROM companies),
      'contacts', (SELECT COUNT(*) FROM contacts),
      'interactions', (SELECT COUNT(*) FROM interactions),
      'users', (SELECT COUNT(*) FROM profiles)
    ),
    'activity', jsonb_build_object(
      'interactions_today', (SELECT COUNT(*) FROM interactions WHERE created_at::date = CURRENT_DATE),
      'active_users_7d', (SELECT COUNT(DISTINCT user_id) FROM interactions WHERE created_at >= NOW() - interval '7 days')
    ),
    'version', '2.0.0'
  );
END;
$function$
