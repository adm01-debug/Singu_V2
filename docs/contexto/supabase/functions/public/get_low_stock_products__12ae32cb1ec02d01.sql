CREATE OR REPLACE FUNCTION public.get_low_stock_products()
 RETURNS TABLE(product_id uuid, sku text, name text, stock_qty integer, min_stock integer, deficit integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id, sku, name, stock_qty, min_stock, min_stock - stock_qty
  FROM products
  WHERE is_active = true AND stock_qty < min_stock
  ORDER BY (min_stock - stock_qty) DESC;
$function$
