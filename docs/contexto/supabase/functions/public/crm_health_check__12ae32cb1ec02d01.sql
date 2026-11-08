CREATE OR REPLACE FUNCTION public.crm_health_check()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  issues jsonb := '[]'::jsonb;
BEGIN
  -- Verificar problemas
  IF (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL) = 0 THEN
    issues := issues || jsonb_build_object('tipo', 'warning', 'mensagem', 'Nenhuma empresa cadastrada');
  END IF;
  
  IF (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - interval '7 days') = 0 THEN
    issues := issues || jsonb_build_object('tipo', 'warning', 'mensagem', 'Nenhuma interação nos últimos 7 dias');
  END IF;
  
  IF (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL AND prioridade = 'high') > 10 THEN
    issues := issues || jsonb_build_object('tipo', 'alert', 'mensagem', 'Mais de 10 alertas de alta prioridade pendentes');
  END IF;
  
  IF (SELECT COUNT(*) FROM interactions WHERE followup_pendente = true AND data_followup < now() - interval '7 days') > 0 THEN
    issues := issues || jsonb_build_object('tipo', 'alert', 'mensagem', 'Existem followups atrasados há mais de 7 dias');
  END IF;
  
  SELECT jsonb_build_object(
    'timestamp', now(),
    'status', CASE WHEN jsonb_array_length(issues) = 0 THEN 'healthy' ELSE 'issues_found' END,
    'metricas', jsonb_build_object(
      'empresas', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'contatos', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'clientes_ativos', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
      'interacoes_ultima_semana', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - interval '7 days'),
      'alertas_pendentes', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL),
      'followups_atrasados', (SELECT COUNT(*) FROM interactions WHERE followup_pendente = true AND data_followup < now())
    ),
    'issues', issues,
    'ultima_interacao', (SELECT MAX(created_at) FROM interactions),
    'ultima_empresa', (SELECT MAX(created_at) FROM companies WHERE deleted_at IS NULL)
  ) INTO result;
  
  RETURN result;
END;
$function$
