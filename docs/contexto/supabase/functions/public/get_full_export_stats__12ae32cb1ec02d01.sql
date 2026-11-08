CREATE OR REPLACE FUNCTION public.get_full_export_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'contagem', jsonb_build_object(
      'companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'contacts', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'customers', (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL),
      'interactions', (SELECT COUNT(*) FROM interactions),
      'alerts', (SELECT COUNT(*) FROM alerts),
      'salespeople', (SELECT COUNT(*) FROM salespeople)
    ),
    'tamanho_estimado_mb', (
      SELECT ROUND(SUM(pg_total_relation_size(quote_ident(tablename)::regclass))::numeric / 1024 / 1024, 2)
      FROM pg_tables WHERE schemaname = 'public'
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
