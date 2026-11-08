CREATE OR REPLACE FUNCTION public.get_cross_sell_recommendations(p_company_id uuid)
 RETURNS TABLE(product_id uuid, product_name text, reason text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.name, 'Popular no segmento'::text
  FROM products p WHERE p.is_active = true ORDER BY p.unit_price DESC LIMIT 5;
$function$
