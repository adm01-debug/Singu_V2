CREATE OR REPLACE FUNCTION public.create_product(p_sku text, p_name text, p_category text DEFAULT NULL::text, p_unit_price numeric DEFAULT 0, p_cost_price numeric DEFAULT 0, p_description text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO products (sku, name, category, unit_price, cost_price, description, margin_pct)
  VALUES (p_sku, p_name, p_category, p_unit_price, p_cost_price, p_description,
    CASE WHEN p_unit_price > 0 THEN ROUND((p_unit_price - p_cost_price) / p_unit_price * 100, 2) ELSE 0 END)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
