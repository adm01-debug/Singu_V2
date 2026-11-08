CREATE OR REPLACE FUNCTION public.search_products(p_query text, p_limit integer DEFAULT 20)
 RETURNS TABLE(product_id uuid, sku text, name text, category text, unit_price numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.sku::text,
    p.name::text,
    p.category::text,
    COALESCE(p.unit_price, 0)
  FROM products p
  WHERE COALESCE(p.is_active, true) = true
    AND (p.name ILIKE '%' || p_query || '%' OR p.sku ILIKE '%' || p_query || '%')
  ORDER BY p.name
  LIMIT p_limit;
END;
$function$
