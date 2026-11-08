CREATE OR REPLACE FUNCTION public.get_pipeline_by_salesperson(p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(t))
  INTO result
  FROM (
    SELECT 
      s.id as vendedor_id,
      s.nome as vendedor,
      (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = false AND ja_comprou = false AND deleted_at IS NULL) as leads,
      (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND ja_comprou = false AND deleted_at IS NULL) as ativados,
      (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND ja_comprou = true AND deleted_at IS NULL) as compradores,
      (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = s.id AND deleted_at IS NULL) as valor_carteira
    FROM salespeople s
    WHERE (p_vendedor_id IS NULL OR s.id = p_vendedor_id)
  ) t;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$
