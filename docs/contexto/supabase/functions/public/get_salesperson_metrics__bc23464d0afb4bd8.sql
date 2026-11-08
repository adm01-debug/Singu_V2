CREATE OR REPLACE FUNCTION public.get_salesperson_metrics(p_vendedor_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'vendedor', (SELECT row_to_json(s) FROM salespeople s WHERE s.id = p_vendedor_id),
    'carteira', jsonb_build_object(
      'total_clientes', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND deleted_at IS NULL),
      'clientes_ativos', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND cliente_ativado = true AND deleted_at IS NULL),
      'clientes_compradores', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND ja_comprou = true AND deleted_at IS NULL),
      'valor_total', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = p_vendedor_id AND deleted_at IS NULL)
    ),
    'atividade', jsonb_build_object(
      'interacoes_hoje', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at::date = CURRENT_DATE),
      'interacoes_semana', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at >= date_trunc('week', now())),
      'interacoes_mes', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at >= date_trunc('month', now())),
      'empresas_atendidas_mes', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at >= date_trunc('month', now()))
    ),
    'pendencias', jsonb_build_object(
      'followups_pendentes', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND followup_pendente = true),
      'followups_atrasados', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND followup_pendente = true AND data_followup < now()),
      'alertas_clientes', (SELECT COUNT(*) FROM alerts a JOIN customers cu ON cu.company_id = a.company_id WHERE cu.vendedor_id = p_vendedor_id AND a.resolved_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
