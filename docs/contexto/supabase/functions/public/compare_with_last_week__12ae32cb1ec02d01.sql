CREATE OR REPLACE FUNCTION public.compare_with_last_week()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'empresas', jsonb_build_object(
      'atual', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'semana_passada', (SELECT COUNT(*) FROM companies WHERE created_at < now() - interval '7 days' AND deleted_at IS NULL),
      'novas_semana', (SELECT COUNT(*) FROM companies WHERE created_at >= now() - interval '7 days' AND deleted_at IS NULL)
    ),
    'interacoes', jsonb_build_object(
      'esta_semana', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - interval '7 days'),
      'semana_passada', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - interval '14 days' AND created_at < now() - interval '7 days')
    ),
    'clientes', jsonb_build_object(
      'ativados_semana', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= now() - interval '7 days' AND deleted_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
