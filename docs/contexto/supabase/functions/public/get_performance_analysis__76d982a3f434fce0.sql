CREATE OR REPLACE FUNCTION public.get_performance_analysis(p_vendedor_id integer DEFAULT NULL::integer, p_period text DEFAULT 'month'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  date_filter timestamptz;
BEGIN
  date_filter := CASE p_period
    WHEN 'week' THEN date_trunc('week', now())
    WHEN 'month' THEN date_trunc('month', now())
    WHEN 'quarter' THEN date_trunc('quarter', now())
    WHEN 'year' THEN date_trunc('year', now())
    ELSE date_trunc('month', now())
  END;
  
  IF p_vendedor_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'periodo', p_period,
      'vendedor_id', p_vendedor_id,
      'vendedor_nome', (SELECT nome FROM salespeople WHERE id = p_vendedor_id),
      'metricas', jsonb_build_object(
        'interacoes', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at >= date_filter),
        'empresas_atendidas', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at >= date_filter),
        'clientes_carteira', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND deleted_at IS NULL),
        'clientes_ativados', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND cliente_ativado = true AND updated_at >= date_filter AND deleted_at IS NULL),
        'valor_vendas', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = p_vendedor_id AND ja_comprou = true AND updated_at >= date_filter AND deleted_at IS NULL)
      )
    ) INTO result;
  ELSE
    SELECT jsonb_build_object(
      'periodo', p_period,
      'metricas_globais', jsonb_build_object(
        'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= date_filter),
        'empresas_novas', (SELECT COUNT(*) FROM companies WHERE created_at >= date_filter AND deleted_at IS NULL),
        'clientes_ativados', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= date_filter AND deleted_at IS NULL),
        'valor_vendas', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE ja_comprou = true AND updated_at >= date_filter AND deleted_at IS NULL)
      )
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$function$
