CREATE OR REPLACE FUNCTION public.get_products_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total_products', (SELECT COUNT(*) FROM products WHERE is_active = true),
    'total_value_stock', (SELECT COALESCE(SUM(stock_quantity * unit_price), 0) FROM products WHERE is_active = true),
    'low_stock_count', (SELECT COUNT(*) FROM products WHERE is_active = true AND stock_quantity <= min_stock),
    'avg_margin', (SELECT ROUND(AVG(margin_percent)::numeric, 1) FROM products WHERE is_active = true AND unit_price > 0),
    'by_category', (
      SELECT COALESCE(jsonb_agg(c), '[]')
      FROM (
        SELECT category, COUNT(*) as count, ROUND(AVG(unit_price)::numeric, 2) as avg_price
        FROM products
        WHERE is_active = true AND category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
      ) c
    ),
    'top_margin', (
      SELECT COALESCE(jsonb_agg(p), '[]')
      FROM (
        SELECT name, margin_percent
        FROM products
        WHERE is_active = true AND unit_price > 0
        ORDER BY margin_percent DESC
        LIMIT 5
      ) p
    )
  );
END;
$function$
