CREATE OR REPLACE FUNCTION public.get_goals_progress(p_vendedor_id integer, p_meta_interacoes integer DEFAULT 100, p_meta_clientes integer DEFAULT 10, p_meta_vendas numeric DEFAULT 50000)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_interacoes int;
  v_clientes int;
  v_vendas numeric;
BEGIN
  -- Interações do mês
  SELECT COUNT(*) INTO v_interacoes
  FROM interactions 
  WHERE usuario_responsavel_id = p_vendedor_id 
  AND date_trunc('month', created_at) = date_trunc('month', now());
  
  -- Clientes ativados no mês
  SELECT COUNT(*) INTO v_clientes
  FROM customers 
  WHERE vendedor_id = p_vendedor_id 
  AND cliente_ativado = true
  AND date_trunc('month', updated_at) = date_trunc('month', now())
  AND deleted_at IS NULL;
  
  -- Vendas do mês
  SELECT COALESCE(SUM(valor_total_compras), 0) INTO v_vendas
  FROM customers 
  WHERE vendedor_id = p_vendedor_id 
  AND ja_comprou = true
  AND date_trunc('month', updated_at) = date_trunc('month', now())
  AND deleted_at IS NULL;
  
  SELECT jsonb_build_object(
    'vendedor_id', p_vendedor_id,
    'mes', to_char(now(), 'YYYY-MM'),
    'interacoes', jsonb_build_object(
      'realizado', v_interacoes,
      'meta', p_meta_interacoes,
      'percentual', ROUND(v_interacoes::numeric / NULLIF(p_meta_interacoes, 0) * 100, 2)
    ),
    'clientes', jsonb_build_object(
      'realizado', v_clientes,
      'meta', p_meta_clientes,
      'percentual', ROUND(v_clientes::numeric / NULLIF(p_meta_clientes, 0) * 100, 2)
    ),
    'vendas', jsonb_build_object(
      'realizado', v_vendas,
      'meta', p_meta_vendas,
      'percentual', ROUND(v_vendas / NULLIF(p_meta_vendas, 0) * 100, 2)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
