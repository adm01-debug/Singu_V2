CREATE OR REPLACE FUNCTION public.add_item_to_deal(p_deal_id uuid, p_product_id uuid, p_quantity integer DEFAULT 1, p_unit_price numeric DEFAULT NULL::numeric, p_discount_percent numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product  products%ROWTYPE;
  v_item_id  uuid;
  v_price    numeric;
BEGIN
  -- Ownership gate: deal must belong to the caller
  IF NOT EXISTS (SELECT 1 FROM deals WHERE id = p_deal_id AND user_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal not found or access denied');
  END IF;

  SELECT * INTO v_product FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Produto não encontrado');
  END IF;

  v_price := COALESCE(p_unit_price, v_product.unit_price);

  INSERT INTO deal_items (deal_id, product_id, product_name, quantity, unit_price, discount_percent)
  VALUES (p_deal_id, p_product_id, v_product.name, p_quantity, v_price, p_discount_percent)
  RETURNING id INTO v_item_id;

  -- Recalculate deal total
  UPDATE deals
  SET valor = (SELECT COALESCE(SUM(total_price), 0) FROM deal_items WHERE deal_id = p_deal_id)
  WHERE id = p_deal_id AND user_id = auth.uid();

  RETURN jsonb_build_object(
    'success',     true,
    'item_id',     v_item_id,
    'total_price', p_quantity * v_price * (1 - p_discount_percent / 100.0)
  );
END;
$function$
