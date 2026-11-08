CREATE OR REPLACE FUNCTION public.check_crm_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'status', 'healthy',
    'timestamp', NOW(),
    'metrics', jsonb_build_object(
      'companies_total', (SELECT COUNT(*) FROM companies),
      'companies_active', (SELECT COUNT(*) FROM companies WHERE status = 'ativo'),
      'contacts_total', (SELECT COUNT(*) FROM contacts),
      'interactions_30d', (SELECT COUNT(*) FROM interactions WHERE created_at >= NOW() - interval '30 days'),
      'users_active', (SELECT COUNT(*) FROM profiles WHERE updated_at >= NOW() - interval '7 days')
    ),
    'database', jsonb_build_object(
      'functions', (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f'),
      'tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'),
      'triggers', (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public')
    )
  );
END;
$function$
