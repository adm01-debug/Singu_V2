CREATE OR REPLACE FUNCTION public.update_product_stock(p_product_id uuid, p_qty_change integer, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old_qty int;
  v_new_qty int;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT stock_qty INTO v_old_qty FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Produto não encontrado'); END IF;
  
  v_new_qty := GREATEST(0, v_old_qty + p_qty_change);
  UPDATE products SET stock_qty = v_new_qty, updated_at = NOW() WHERE id = p_product_id;
  
  RETURN jsonb_build_object('product_id', p_product_id, 'old_qty', v_old_qty, 'new_qty', v_new_qty, 'change', p_qty_change);
END;
$function$
