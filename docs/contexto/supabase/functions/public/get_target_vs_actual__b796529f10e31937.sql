CREATE OR REPLACE FUNCTION public.get_target_vs_actual(p_vendedor_id integer DEFAULT NULL::integer, p_meta_empresas integer DEFAULT 50, p_meta_clientes integer DEFAULT 20, p_meta_valor numeric DEFAULT 100000)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF p_vendedor_id IS NULL THEN
    -- Geral
    SELECT jsonb_build_object(
      'periodo', 'mes_atual',
      'empresas', jsonb_build_object(
        'meta', p_meta_empresas,
        'realizado', (SELECT COUNT(*) FROM companies WHERE created_at >= date_trunc('month', now()) AND deleted_at IS NULL),
        'percentual', ROUND((SELECT COUNT(*) FROM companies WHERE created_at >= date_trunc('month', now()) AND deleted_at IS NULL)::numeric / p_meta_empresas * 100, 2)
      ),
      'clientes', jsonb_build_object(
        'meta', p_meta_clientes,
        'realizado', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL),
        'percentual', ROUND((SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL)::numeric / p_meta_clientes * 100, 2)
      ),
      'valor', jsonb_build_object(
        'meta', p_meta_valor,
        'realizado', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE ja_comprou = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL),
        'percentual', ROUND((SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE ja_comprou = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL)::numeric / p_meta_valor * 100, 2)
      )
    ) INTO result;
  ELSE
    -- Por vendedor
    SELECT jsonb_build_object(
      'vendedor_id', p_vendedor_id,
      'vendedor_nome', (SELECT nome FROM salespeople WHERE id = p_vendedor_id),
      'periodo', 'mes_atual',
      'clientes', jsonb_build_object(
        'meta', p_meta_clientes,
        'realizado', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND cliente_ativado = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL),
        'percentual', ROUND((SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND cliente_ativado = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL)::numeric / p_meta_clientes * 100, 2)
      ),
      'valor', jsonb_build_object(
        'meta', p_meta_valor,
        'realizado', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = p_vendedor_id AND ja_comprou = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL),
        'percentual', ROUND((SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = p_vendedor_id AND ja_comprou = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL)::numeric / p_meta_valor * 100, 2)
      )
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$function$
