CREATE OR REPLACE FUNCTION public.create_product(p_name text, p_sku text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_unit_price numeric DEFAULT 0, p_cost_price numeric DEFAULT 0, p_description text DEFAULT NULL::text, p_stock_quantity integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product_id uuid;
  v_sku text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  v_sku := COALESCE(p_sku, 'SKU-' || EXTRACT(EPOCH FROM NOW())::bigint);
  
  INSERT INTO products (sku, name, description, category, unit_price, cost_price, stock_quantity)
  VALUES (v_sku, p_name, p_description, p_category, p_unit_price, p_cost_price, p_stock_quantity)
  RETURNING id INTO v_product_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'product_id', v_product_id,
    'sku', v_sku
  );
END;
$function$
