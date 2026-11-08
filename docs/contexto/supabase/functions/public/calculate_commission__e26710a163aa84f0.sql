CREATE OR REPLACE FUNCTION public.calculate_commission(p_vendedor_id integer, p_start_date date DEFAULT (date_trunc('month'::text, now()))::date, p_end_date date DEFAULT CURRENT_DATE, p_taxa_comissao numeric DEFAULT 5.0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  total_vendas numeric;
  comissao numeric;
BEGIN
  SELECT COALESCE(SUM(valor_total_compras), 0) INTO total_vendas
  FROM customers
  WHERE vendedor_id = p_vendedor_id
  AND ja_comprou = true
  AND updated_at::date BETWEEN p_start_date AND p_end_date
  AND deleted_at IS NULL;
  
  comissao := total_vendas * (p_taxa_comissao / 100);
  
  SELECT jsonb_build_object(
    'vendedor_id', p_vendedor_id,
    'vendedor_nome', (SELECT nome FROM salespeople WHERE id = p_vendedor_id),
    'periodo', jsonb_build_object('inicio', p_start_date, 'fim', p_end_date),
    'total_vendas', ROUND(total_vendas, 2),
    'taxa_comissao', p_taxa_comissao,
    'comissao_calculada', ROUND(comissao, 2),
    'clientes_periodo', (
      SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND ja_comprou = true AND updated_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
