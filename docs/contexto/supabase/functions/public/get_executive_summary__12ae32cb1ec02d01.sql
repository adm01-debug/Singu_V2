CREATE OR REPLACE FUNCTION public.get_executive_summary()
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
    'visao_geral', jsonb_build_object(
      'total_empresas', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'total_clientes', (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL),
      'clientes_ativos', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
      'valor_carteira', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE deleted_at IS NULL),
      'ticket_medio', (SELECT ROUND(AVG(ticket_medio), 2) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL)
    ),
    'ultimos_30_dias', jsonb_build_object(
      'novas_empresas', (SELECT COUNT(*) FROM companies WHERE created_at >= now() - interval '30 days' AND deleted_at IS NULL),
      'novos_clientes', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= now() - interval '30 days' AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - interval '30 days'),
      'valor_vendas', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE ja_comprou = true AND updated_at >= now() - interval '30 days' AND deleted_at IS NULL)
    ),
    'alertas_criticos', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL AND prioridade = 'high'),
    'vendedores_ativos', (SELECT COUNT(DISTINCT usuario_responsavel_id) FROM interactions WHERE created_at >= now() - interval '7 days')
  ) INTO result;
  
  RETURN result;
END;
$function$
