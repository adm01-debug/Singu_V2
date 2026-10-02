-- 9. Contrato ERP → SINGU — registrar_pedido_erp (idempotente, service_role apenas)
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
$function$;

REVOKE ALL ON FUNCTION public.registrar_pedido_erp(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_pedido_erp(jsonb) TO service_role;

-- trg_after_purchase: deriva campos de customers, aplica crédito (seção 7), atualiza rotation_state
CREATE OR REPLACE FUNCTION public.trg_after_purchase()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_rot RECORD;
  v_credito_id integer;
  v_teve_contato boolean;
  v_config_credito_dias integer;
  v_config_protecao_dias integer;
BEGIN
  SELECT COALESCE(NULLIF(valor,'')::int, 30) INTO v_config_credito_dias
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_CREDITO_ANTERIOR_DIAS';
  SELECT COALESCE(NULLIF(valor,'')::int, 180) INTO v_config_protecao_dias
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_DIAS_PROTECAO_POS_PEDIDO';

  UPDATE public.customers SET
    ja_comprou = true,
    data_primeira_compra = LEAST(COALESCE(data_primeira_compra, NEW.data_pedido), NEW.data_pedido),
    data_ultima_compra = GREATEST(COALESCE(data_ultima_compra, NEW.data_pedido), NEW.data_pedido),
    total_pedidos = COALESCE(total_pedidos,0) + 1,
    valor_total_compras = COALESCE(valor_total_compras,0) + COALESCE(NEW.valor,0),
    ticket_medio = (COALESCE(valor_total_compras,0) + COALESCE(NEW.valor,0))
                   / (COALESCE(total_pedidos,0) + 1),
    updated_at = now()
  WHERE id = NEW.customer_id;

  PERFORM public.ativar_cliente(NEW.customer_id, NULL, 'ERP')
    WHERE EXISTS (SELECT 1 FROM public.customers WHERE id = NEW.customer_id AND cliente_ativado = false);

  -- Seção 7: crédito ao closer anterior se o atual ainda não contatou
  SELECT * INTO v_rot FROM public.customer_ownership_history
    WHERE customer_id = NEW.customer_id AND motivo_saida = 'EXPIROU_CICLO'
      AND data_fim >= NEW.data_pedido - v_config_credito_dias
    ORDER BY data_fim DESC LIMIT 1;

  IF FOUND THEN
    SELECT EXISTS (
      SELECT 1 FROM public.interactions i
      JOIN public.customers cu ON cu.company_id = i.company_id
      WHERE cu.id = NEW.customer_id
        AND i.usuario_responsavel_id = (SELECT vendedor_id FROM public.customers WHERE id = NEW.customer_id)
        AND i.data_interacao::date BETWEEN v_rot.data_fim AND NEW.data_pedido
    ) INTO v_teve_contato;

    IF NOT v_teve_contato THEN
      v_credito_id := v_rot.vendedor_id;
      UPDATE public.customer_purchases SET vendedor_credito_id = v_credito_id WHERE id = NEW.id;
      INSERT INTO public.customer_events (customer_id, company_id, evento_tipo, data_evento, vendedor_id, dados_extras)
      VALUES (NEW.customer_id, NEW.company_id, 'CREDITO_ANTERIOR', NEW.data_pedido, v_credito_id,
        jsonb_build_object('purchase_id', NEW.id, 'vendedor_atual_id', (SELECT vendedor_id FROM public.customers WHERE id = NEW.customer_id)));
    END IF;
  END IF;

  -- 1ª compra: fecha customer_sdr_history aberta
  UPDATE public.customer_sdr_history
    SET data_fim = NEW.data_pedido, resultado = 'ATIVOU'
    WHERE customer_id = NEW.customer_id AND data_fim IS NULL;

  UPDATE public.customer_purchases SET sdr_credito_id =
    (SELECT sdr_id FROM public.customer_sdr_history
       WHERE customer_id = NEW.customer_id AND resultado = 'ATIVOU'
       ORDER BY data_fim DESC LIMIT 1)
    WHERE id = NEW.id AND sdr_credito_id IS NULL;

  -- Segmento e relógio do closer
  INSERT INTO public.customer_rotation_state (customer_id, segmento, proxima_rotacao_closer, updated_at)
  VALUES (NEW.customer_id, 'ATIVO', NEW.data_pedido + v_config_protecao_dias, now())
  ON CONFLICT (customer_id) DO UPDATE SET
    segmento = 'ATIVO',
    proxima_rotacao_closer = NEW.data_pedido + v_config_protecao_dias,
    pool_frio = false,
    updated_at = now();

  INSERT INTO public.customer_events (customer_id, company_id, evento_tipo, data_evento, dados_extras)
  VALUES (NEW.customer_id, NEW.company_id, 'PEDIDO_ERP', NEW.data_pedido,
    jsonb_build_object('purchase_id', NEW.id, 'origem', NEW.origem, 'valor', NEW.valor));

  RETURN NEW;
END;
$function$;

DO $migration$
BEGIN
  IF to_regclass('public.customer_purchases') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_customer_purchases_after_insert ON public.customer_purchases;
    CREATE TRIGGER trg_customer_purchases_after_insert
      AFTER INSERT ON public.customer_purchases
      FOR EACH ROW EXECUTE FUNCTION public.trg_after_purchase();
  END IF;
END;
$migration$;

REVOKE ALL ON FUNCTION public.trg_after_purchase() FROM PUBLIC, anon, authenticated;
