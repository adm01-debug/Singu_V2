CREATE OR REPLACE FUNCTION public.get_system_activity_summary(p_hours integer DEFAULT 24)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_horas', p_hours,
    'timestamp', now(),
    'atividades', jsonb_build_object(
      'interacoes_criadas', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - (p_hours || ' hours')::interval),
      'empresas_criadas', (SELECT COUNT(*) FROM companies WHERE created_at >= now() - (p_hours || ' hours')::interval AND deleted_at IS NULL),
      'contatos_criados', (SELECT COUNT(*) FROM contacts WHERE created_at >= now() - (p_hours || ' hours')::interval AND deleted_at IS NULL),
      'alertas_criados', (SELECT COUNT(*) FROM alerts WHERE created_at >= now() - (p_hours || ' hours')::interval),
      'alertas_resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at >= now() - (p_hours || ' hours')::interval)
    ),
    'usuarios_ativos', (
      SELECT jsonb_agg(DISTINCT usuario_responsavel_id)
      FROM interactions
      WHERE created_at >= now() - (p_hours || ' hours')::interval
      AND usuario_responsavel_id IS NOT NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
