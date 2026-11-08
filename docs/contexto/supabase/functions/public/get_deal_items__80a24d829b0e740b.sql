CREATE OR REPLACE FUNCTION public.get_deal_items(p_deal_id uuid)
 RETURNS TABLE(id uuid, product_id uuid, product_name text, sku text, quantity integer, unit_price numeric, discount_percent numeric, total_price numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    di.id,
    di.product_id,
    di.product_name,
    pr.sku,
    di.quantity,
    di.unit_price,
    di.discount_percent,
    di.total_price
  FROM deal_items di
  LEFT JOIN products pr ON pr.id = di.product_id
  WHERE di.deal_id = p_deal_id
  ORDER BY di.created_at;
END;
$function$
