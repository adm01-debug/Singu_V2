CREATE OR REPLACE FUNCTION public.get_import_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'ultimo_dia', jsonb_build_object(
      'empresas', (SELECT COUNT(*) FROM companies WHERE created_at >= now() - interval '1 day'),
      'contatos', (SELECT COUNT(*) FROM contacts WHERE created_at >= now() - interval '1 day'),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - interval '1 day')
    ),
    'ultima_semana', jsonb_build_object(
      'empresas', (SELECT COUNT(*) FROM companies WHERE created_at >= now() - interval '7 days'),
      'contatos', (SELECT COUNT(*) FROM contacts WHERE created_at >= now() - interval '7 days'),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - interval '7 days')
    ),
    'ultimo_mes', jsonb_build_object(
      'empresas', (SELECT COUNT(*) FROM companies WHERE created_at >= now() - interval '30 days'),
      'contatos', (SELECT COUNT(*) FROM contacts WHERE created_at >= now() - interval '30 days'),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - interval '30 days')
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
