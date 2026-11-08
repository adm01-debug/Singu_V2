CREATE OR REPLACE FUNCTION public.get_salesperson_history(p_vendedor_id integer, p_months integer DEFAULT 6)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'vendedor_id', p_vendedor_id,
    'vendedor_nome', (SELECT nome FROM salespeople WHERE id = p_vendedor_id),
    'periodo_meses', p_months,
    'evolucao_mensal', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes)
      FROM (
        SELECT 
          date_trunc('month', i.created_at)::date as mes,
          COUNT(*) as interacoes,
          COUNT(DISTINCT i.company_id) as empresas
        FROM interactions i
        WHERE i.usuario_responsavel_id = p_vendedor_id
        AND i.created_at >= now() - (p_months || ' months')::interval
        GROUP BY date_trunc('month', i.created_at)::date
      ) t
    ),
    'totais', jsonb_build_object(
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at >= now() - (p_months || ' months')::interval),
      'empresas_atendidas', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at >= now() - (p_months || ' months')::interval),
      'clientes_carteira', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND deleted_at IS NULL),
      'clientes_ativados', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND cliente_ativado = true AND deleted_at IS NULL),
      'valor_vendas', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = p_vendedor_id AND deleted_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
