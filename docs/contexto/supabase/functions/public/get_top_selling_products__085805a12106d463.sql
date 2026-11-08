CREATE OR REPLACE FUNCTION public.get_top_selling_products(p_days integer DEFAULT 90, p_limit integer DEFAULT 10)
 RETURNS TABLE(product_id uuid, product_name text, sku text, total_quantity integer, total_revenue numeric, deals_count integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    di.product_id,
    pr.name,
    pr.sku,
    SUM(di.quantity)::integer as total_quantity,
    SUM(di.total_price) as total_revenue,
    COUNT(DISTINCT di.deal_id)::integer as deals_count
  FROM deal_items di
  JOIN products pr ON pr.id = di.product_id
  JOIN deals d ON d.id = di.deal_id
  WHERE d.status = 'ganho'
    AND d.closed_at >= CURRENT_DATE - p_days
  GROUP BY di.product_id, pr.name, pr.sku
  ORDER BY total_revenue DESC
  LIMIT p_limit;
END;
$function$
