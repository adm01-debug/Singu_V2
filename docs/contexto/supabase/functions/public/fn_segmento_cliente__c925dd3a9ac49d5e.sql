CREATE OR REPLACE FUNCTION public.fn_segmento_cliente(p_customer_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_state RECORD;
  v_ultimo_pedido date;
  v_dias_protecao int;
BEGIN
  SELECT COALESCE(NULLIF(valor,'')::int, 180) INTO v_dias_protecao
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_DIAS_PROTECAO_POS_PEDIDO';

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_state FROM public.customer_rotation_state WHERE customer_id = p_customer_id;

  IF v_customer.vendedor_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = v_customer.vendedor_id AND u.participa_rodizio_closer
  ) THEN
    RETURN 'FORA_RODIZIO';
  END IF;

  IF FOUND AND v_state.pool_frio THEN
    RETURN 'POOL_FRIO';
  END IF;

  IF FOUND AND v_state.bloqueado_ate IS NOT NULL AND v_state.bloqueado_ate >= CURRENT_DATE THEN
    RETURN 'BLOQUEADO';
  END IF;

  SELECT max(data_pedido) INTO v_ultimo_pedido FROM public.customer_purchases WHERE customer_id = p_customer_id;

  IF v_ultimo_pedido IS NULL THEN
    RETURN 'NAO_ATIVADO';
  END IF;

  IF CURRENT_DATE - v_ultimo_pedido < v_dias_protecao THEN
    RETURN 'ATIVO';
  END IF;

  RETURN 'INATIVO';
END;
$function$
