CREATE OR REPLACE FUNCTION public.get_products(p_category text DEFAULT NULL::text, p_active_only boolean DEFAULT true)
 RETURNS TABLE(product_id uuid, sku text, name text, category text, unit_price numeric, is_active boolean)
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
    COALESCE(p.unit_price, 0),
    COALESCE(p.is_active, true)
  FROM products p
  WHERE (p_category IS NULL OR p.category = p_category)
    AND (NOT p_active_only OR COALESCE(p.is_active, true) = true)
  ORDER BY p.name;
END;
$function$
