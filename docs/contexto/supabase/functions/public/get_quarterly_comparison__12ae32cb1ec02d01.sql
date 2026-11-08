CREATE OR REPLACE FUNCTION public.get_quarterly_comparison()
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
    'trimestre_atual', jsonb_build_object(
      'inicio', date_trunc('quarter', now()),
      'empresas', (SELECT COUNT(*) FROM companies WHERE created_at >= date_trunc('quarter', now()) AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= date_trunc('quarter', now())),
      'valor', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE ja_comprou = true AND updated_at >= date_trunc('quarter', now()) AND deleted_at IS NULL)
    ),
    'trimestre_anterior', jsonb_build_object(
      'inicio', date_trunc('quarter', now() - interval '3 months'),
      'empresas', (SELECT COUNT(*) FROM companies WHERE created_at >= date_trunc('quarter', now() - interval '3 months') AND created_at < date_trunc('quarter', now()) AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= date_trunc('quarter', now() - interval '3 months') AND created_at < date_trunc('quarter', now())),
      'valor', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE ja_comprou = true AND updated_at >= date_trunc('quarter', now() - interval '3 months') AND updated_at < date_trunc('quarter', now()) AND deleted_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
