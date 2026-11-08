CREATE OR REPLACE FUNCTION public.registrar_pedido_erp(p jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_company_id uuid;
  v_pedido_id text;
  v_cnpj text;
  v_data_pedido date;
  v_valor numeric(14,2);
  v_purchase_id uuid;
  v_is_primeira_compra boolean;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  v_pedido_id := p->>'pedido_id';
  v_data_pedido := (p->>'data_pedido')::date;
  v_valor := NULLIF(p->>'valor','')::numeric(14,2);

  IF v_pedido_id IS NULL OR v_data_pedido IS NULL THEN
    RETURN jsonb_build_object('status','error','code','PARAMETROS_INVALIDOS',
      'message','pedido_id e data_pedido são obrigatórios');
  END IF;

  IF p ? 'company_id' THEN
    v_company_id := (p->>'company_id')::uuid;
  ELSE
    v_cnpj := regexp_replace(COALESCE(p->>'cnpj',''), '\D', '', 'g');
    SELECT id INTO v_company_id FROM public.companies
      WHERE regexp_replace(COALESCE(cnpj,''), '\D', '', 'g') = v_cnpj
      LIMIT 1;
  END IF;

  IF v_company_id IS NULL THEN
    INSERT INTO public.integration_logs (action, direction, status, request_data, error_message)
    VALUES ('registrar_pedido_erp', 'inbound', 'error', p, 'CLIENTE_NAO_ENCONTRADO');
    RETURN jsonb_build_object('status','error','code','CLIENTE_NAO_ENCONTRADO');
  END IF;

  SELECT cu.* INTO v_customer FROM public.customers cu
    WHERE cu.company_id = v_company_id LIMIT 1;

  IF NOT FOUND THEN
    INSERT INTO public.integration_logs (action, direction, status, request_data, error_message)
    VALUES ('registrar_pedido_erp', 'inbound', 'error', p, 'CLIENTE_NAO_ENCONTRADO');
    RETURN jsonb_build_object('status','error','code','CLIENTE_NAO_ENCONTRADO');
  END IF;

  v_is_primeira_compra := v_customer.data_primeira_compra IS NULL;

  INSERT INTO public.customer_purchases
    (customer_id, company_id, origem, origem_pedido_id, data_pedido, valor,
     vendedor_id, vendedor_credito_id, raw)
  VALUES
    (v_customer.id, v_company_id, COALESCE(p->>'origem','MANUAL'), v_pedido_id, v_data_pedido, v_valor,
     v_customer.vendedor_id, v_customer.vendedor_id, p)
  ON CONFLICT (origem, origem_pedido_id) DO NOTHING
  RETURNING id INTO v_purchase_id;

  IF v_purchase_id IS NULL THEN
    RETURN jsonb_build_object('status','ok','code','JA_PROCESSADO','pedido_id',v_pedido_id);
  END IF;

  RETURN jsonb_build_object('status','success','purchase_id',v_purchase_id,
    'customer_id', v_customer.id, 'primeira_compra', v_is_primeira_compra);
END;
$function$
