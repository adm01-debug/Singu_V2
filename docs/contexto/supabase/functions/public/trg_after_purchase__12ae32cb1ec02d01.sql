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
  v_resultado_sdr text;
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
  SELECT * INTO v_rot FROM public.customer_ownership_history
    WHERE customer_id = NEW.customer_id AND motivo_saida = 'EXPIROU_CICLO'
      AND data_fim >= NEW.data_pedido - v_config_credito_dias
    ORDER BY data_fim DESC LIMIT 1;
  IF FOUND THEN
    SELECT EXISTS (
      SELECT 1 FROM public.interactions AS i
      JOIN public.customers AS cu ON cu.company_id = i.company_id
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
  SELECT CASE WHEN COALESCE(c.total_pedidos, 0) <= 1 THEN 'QUALIFICADO' ELSE 'REATIVADO' END
    INTO v_resultado_sdr FROM public.customers AS c WHERE c.id = NEW.customer_id;
  UPDATE public.customer_sdr_history
    SET data_fim = NEW.data_pedido, resultado = v_resultado_sdr
    WHERE customer_id = NEW.customer_id AND data_fim IS NULL;
  UPDATE public.customer_purchases SET sdr_credito_id =
    (SELECT sdr_id FROM public.customer_sdr_history
       WHERE customer_id = NEW.customer_id AND resultado IN ('QUALIFICADO','REATIVADO')
       ORDER BY data_fim DESC LIMIT 1)
    WHERE id = NEW.id AND sdr_credito_id IS NULL;
  INSERT INTO public.customer_rotation_state (customer_id, segmento, proxima_rotacao_closer, updated_at)
  VALUES (NEW.customer_id, 'ATIVO', NEW.data_pedido + v_config_protecao_dias, now())
  ON CONFLICT (customer_id) DO UPDATE SET
    segmento = 'ATIVO', proxima_rotacao_closer = NEW.data_pedido + v_config_protecao_dias,
    pool_frio = false, updated_at = now();
  INSERT INTO public.customer_events (customer_id, company_id, evento_tipo, data_evento, dados_extras)
  VALUES (NEW.customer_id, NEW.company_id, 'PEDIDO_ERP', NEW.data_pedido,
    jsonb_build_object('purchase_id', NEW.id, 'origem', NEW.origem, 'valor', NEW.valor));
  RETURN NEW;
END;
$function$
