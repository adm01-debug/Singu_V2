CREATE OR REPLACE FUNCTION public.get_growth_analysis()
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
    'mes_atual', jsonb_build_object(
      'empresas', (SELECT COUNT(*) FROM companies WHERE date_trunc('month', created_at) = date_trunc('month', now()) AND deleted_at IS NULL),
      'clientes', (SELECT COUNT(*) FROM customers WHERE date_trunc('month', updated_at) = date_trunc('month', now()) AND cliente_ativado = true AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE date_trunc('month', created_at) = date_trunc('month', now()))
    ),
    'mes_anterior', jsonb_build_object(
      'empresas', (SELECT COUNT(*) FROM companies WHERE date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month') AND deleted_at IS NULL),
      'clientes', (SELECT COUNT(*) FROM customers WHERE date_trunc('month', updated_at) = date_trunc('month', now() - interval '1 month') AND cliente_ativado = true AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month'))
    ),
    'crescimento_percentual', jsonb_build_object(
      'empresas', ROUND(
        ((SELECT COUNT(*) FROM companies WHERE date_trunc('month', created_at) = date_trunc('month', now()) AND deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM companies WHERE date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month') AND deleted_at IS NULL), 0) - 1) * 100, 2
      ),
      'interacoes', ROUND(
        ((SELECT COUNT(*) FROM interactions WHERE date_trunc('month', created_at) = date_trunc('month', now()))::numeric /
        NULLIF((SELECT COUNT(*) FROM interactions WHERE date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month')), 0) - 1) * 100, 2
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
