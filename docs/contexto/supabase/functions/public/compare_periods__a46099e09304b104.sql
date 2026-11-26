CREATE OR REPLACE FUNCTION public.compare_periods(p_period1_start date, p_period1_end date, p_period2_start date, p_period2_end date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo1', jsonb_build_object(
      'inicio', p_period1_start, 'fim', p_period1_end,
      'empresas', (SELECT COUNT(*) FROM companies WHERE created_at::date BETWEEN p_period1_start AND p_period1_end AND deleted_at IS NULL),
      'contatos', (SELECT COUNT(*) FROM contacts WHERE created_at::date BETWEEN p_period1_start AND p_period1_end AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at::date BETWEEN p_period1_start AND p_period1_end),
      'clientes_ativados', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at::date BETWEEN p_period1_start AND p_period1_end AND deleted_at IS NULL),
      'valor_vendas', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE ja_comprou = true AND updated_at::date BETWEEN p_period1_start AND p_period1_end AND deleted_at IS NULL)
    ),
    'periodo2', jsonb_build_object(
      'inicio', p_period2_start, 'fim', p_period2_end,
      'empresas', (SELECT COUNT(*) FROM companies WHERE created_at::date BETWEEN p_period2_start AND p_period2_end AND deleted_at IS NULL),
      'contatos', (SELECT COUNT(*) FROM contacts WHERE created_at::date BETWEEN p_period2_start AND p_period2_end AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at::date BETWEEN p_period2_start AND p_period2_end),
      'clientes_ativados', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at::date BETWEEN p_period2_start AND p_period2_end AND deleted_at IS NULL),
      'valor_vendas', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE ja_comprou = true AND updated_at::date BETWEEN p_period2_start AND p_period2_end AND deleted_at IS NULL)
    ),
    'variacao_percentual', jsonb_build_object(
      'empresas', ROUND(((SELECT COUNT(*) FROM companies WHERE created_at::date BETWEEN p_period2_start AND p_period2_end AND deleted_at IS NULL)::numeric / NULLIF((SELECT COUNT(*) FROM companies WHERE created_at::date BETWEEN p_period1_start AND p_period1_end AND deleted_at IS NULL), 0) - 1) * 100, 2),
      'interacoes', ROUND(((SELECT COUNT(*) FROM interactions WHERE created_at::date BETWEEN p_period2_start AND p_period2_end)::numeric / NULLIF((SELECT COUNT(*) FROM interactions WHERE created_at::date BETWEEN p_period1_start AND p_period1_end), 0) - 1) * 100, 2)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
