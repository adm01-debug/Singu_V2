CREATE OR REPLACE FUNCTION public.get_commission_ranking(p_start_date date DEFAULT (date_trunc('month'::text, now()))::date, p_end_date date DEFAULT CURRENT_DATE, p_taxa_comissao numeric DEFAULT 5.0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo', jsonb_build_object('inicio', p_start_date, 'fim', p_end_date),
    'taxa_comissao', p_taxa_comissao,
    'ranking', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.comissao DESC)
      FROM (
        SELECT 
          s.id,
          s.nome,
          COALESCE(SUM(cu.valor_total_compras), 0) as total_vendas,
          ROUND(COALESCE(SUM(cu.valor_total_compras), 0) * (p_taxa_comissao / 100), 2) as comissao,
          COUNT(cu.id) as clientes
        FROM salespeople s
        LEFT JOIN customers cu ON cu.vendedor_id = s.id AND cu.ja_comprou = true AND cu.updated_at::date BETWEEN p_start_date AND p_end_date AND cu.deleted_at IS NULL
        GROUP BY s.id, s.nome
      ) t
    ),
    'total_comissoes', (
      SELECT ROUND(SUM(valor_total_compras) * (p_taxa_comissao / 100), 2)
      FROM customers WHERE ja_comprou = true AND updated_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
