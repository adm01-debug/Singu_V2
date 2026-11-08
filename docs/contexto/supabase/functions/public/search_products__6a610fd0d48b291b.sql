CREATE OR REPLACE FUNCTION public.search_products(p_query text, p_category text DEFAULT NULL::text, p_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, sku text, name text, category text, unit_price numeric, stock_qty integer, margin_pct numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, p.sku::text, p.name::text, p.category::text, p.unit_price, p.stock_qty, p.margin_pct
  FROM products p
  WHERE p.is_active = true
    AND (p.name ILIKE '%' || p_query || '%' OR p.sku ILIKE '%' || p_query || '%')
    AND (p_category IS NULL OR p.category = p_category)
  ORDER BY p.name
  LIMIT p_limit;
END;
$function$
