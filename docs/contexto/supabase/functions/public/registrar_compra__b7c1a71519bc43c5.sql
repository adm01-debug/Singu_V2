CREATE OR REPLACE FUNCTION public.registrar_compra(p_customer_id uuid, p_valor numeric, p_numero_pedido text, p_observacoes text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_purchase_id uuid;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role)
          OR (auth.jwt() ->> 'aal') IS DISTINCT FROM 'aal2') THEN
    RAISE EXCEPTION 'Acesso negado: exige admin com MFA ou service_role' USING ERRCODE = '42501';
  END IF;
  IF p_customer_id IS NULL OR p_valor IS NULL OR p_valor < 0
     OR NULLIF(btrim(p_numero_pedido), '') IS NULL THEN
    RAISE EXCEPTION 'customer_id, valor não negativo e número do pedido são obrigatórios' USING ERRCODE = '22023';
  END IF;
  SELECT c.* INTO v_customer FROM public.customers AS c
  WHERE c.id = p_customer_id AND c.deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não encontrado' USING ERRCODE = 'P0002'; END IF;
  SELECT p.id INTO v_purchase_id FROM public.customer_purchases AS p
  WHERE p.customer_id = p_customer_id AND p.origem = 'MANUAL'
    AND p.origem_pedido_id = btrim(p_numero_pedido)
  ORDER BY p.created_at LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'created', false, 'purchase_id', v_purchase_id,
      'customer_id', p_customer_id, 'message', 'Pedido manual já registrado');
  END IF;
  INSERT INTO public.customer_purchases
    (customer_id, company_id, origem, origem_pedido_id, data_pedido, valor, raw)
  VALUES
    (p_customer_id, v_customer.company_id, 'MANUAL', btrim(p_numero_pedido), CURRENT_DATE,
     p_valor, jsonb_build_object('observacoes', p_observacoes))
  RETURNING id INTO v_purchase_id;
  RETURN jsonb_build_object('ok', true, 'created', true, 'purchase_id', v_purchase_id,
    'customer_id', p_customer_id, 'valor', p_valor, 'trigger_managed_metrics', true);
END;
$function$
