CREATE OR REPLACE FUNCTION public.get_salesperson_kpis(p_vendedor_id integer, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  start_date timestamptz := now() - (p_days || ' days')::interval;
BEGIN
  SELECT jsonb_build_object(
    'vendedor_id', p_vendedor_id,
    'periodo_dias', p_days,
    'total_clientes', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id),
    'clientes_ativos', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND cliente_ativado = true),
    'clientes_inativos', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND cliente_ativado = false),
    'interacoes_periodo', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at >= start_date),
    'valor_total_vendas', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = p_vendedor_id),
    'ticket_medio', (SELECT COALESCE(AVG(ticket_medio), 0) FROM customers WHERE vendedor_id = p_vendedor_id AND ticket_medio > 0),
    'taxa_ativacao', (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE cliente_ativado = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 2
      ) FROM customers WHERE vendedor_id = p_vendedor_id
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
