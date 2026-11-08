CREATE OR REPLACE FUNCTION public.list_products(p_category text DEFAULT NULL::text, p_active_only boolean DEFAULT true, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, sku text, name text, category text, unit_price numeric, cost_price numeric, margin_percent numeric, stock_quantity integer, is_active boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    pr.id,
    pr.sku,
    pr.name,
    pr.category,
    pr.unit_price,
    pr.cost_price,
    pr.margin_percent,
    pr.stock_quantity,
    pr.is_active
  FROM products pr
  WHERE (NOT p_active_only OR pr.is_active = true)
    AND (p_category IS NULL OR pr.category = p_category)
    AND (p_search IS NULL OR pr.name ILIKE '%' || p_search || '%' OR pr.sku ILIKE '%' || p_search || '%')
  ORDER BY pr.name
  LIMIT p_limit;
END;
$function$
