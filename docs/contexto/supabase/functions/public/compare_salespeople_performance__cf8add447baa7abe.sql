CREATE OR REPLACE FUNCTION public.compare_salespeople_performance(p_vendedor_id_1 integer, p_vendedor_id_2 integer, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'vendedor_1', jsonb_build_object(
      'id', p_vendedor_id_1,
      'nome', (SELECT nome FROM salespeople WHERE id = p_vendedor_id_1),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id_1 AND created_at >= now() - (p_days || ' days')::interval),
      'empresas_atendidas', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id_1 AND created_at >= now() - (p_days || ' days')::interval),
      'clientes_ativos', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id_1 AND cliente_ativado = true AND deleted_at IS NULL),
      'valor_carteira', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = p_vendedor_id_1 AND deleted_at IS NULL)
    ),
    'vendedor_2', jsonb_build_object(
      'id', p_vendedor_id_2,
      'nome', (SELECT nome FROM salespeople WHERE id = p_vendedor_id_2),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id_2 AND created_at >= now() - (p_days || ' days')::interval),
      'empresas_atendidas', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id_2 AND created_at >= now() - (p_days || ' days')::interval),
      'clientes_ativos', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id_2 AND cliente_ativado = true AND deleted_at IS NULL),
      'valor_carteira', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = p_vendedor_id_2 AND deleted_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
