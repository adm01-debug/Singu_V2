CREATE OR REPLACE FUNCTION public.list_customers_by_segment(p_segment text, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, nome_crm text, valor_compras numeric, total_pedidos integer, vendedor text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as nome_crm,
    cu.valor_total_compras as valor_compras,
    cu.total_pedidos,
    cu.vendedor_nome as vendedor
  FROM companies c
  JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  WHERE c.deleted_at IS NULL
  AND CASE p_segment
    WHEN 'compradores_frequentes' THEN cu.total_pedidos >= 3
    WHEN 'alto_valor' THEN cu.valor_total_compras >= 50000
    WHEN 'inativos_valiosos' THEN cu.valor_total_compras >= 10000 AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.data_interacao >= now() - interval '60 days')
    WHEN 'potenciais_upsell' THEN cu.cliente_ativado = true AND cu.ja_comprou = true AND cu.valor_total_compras < 20000 AND cu.total_pedidos = 1
    WHEN 'novos' THEN cu.created_at >= now() - interval '30 days'
    ELSE true
  END
  ORDER BY cu.valor_total_compras DESC NULLS LAST
  LIMIT p_limit;
END;
$function$
