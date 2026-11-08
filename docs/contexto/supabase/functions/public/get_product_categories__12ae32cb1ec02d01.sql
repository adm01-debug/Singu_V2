CREATE OR REPLACE FUNCTION public.get_product_categories()
 RETURNS TABLE(category text, product_count bigint, total_value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT category, COUNT(*), SUM(unit_price * stock_qty)
  FROM products WHERE is_active = true
  GROUP BY category ORDER BY COUNT(*) DESC;
$function$
