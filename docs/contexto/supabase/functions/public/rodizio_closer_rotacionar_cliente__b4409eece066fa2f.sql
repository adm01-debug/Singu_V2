CREATE OR REPLACE FUNCTION public.rodizio_closer_rotacionar_cliente(p_customer_id uuid, p_execucao_id uuid DEFAULT NULL::uuid, p_motivo_entrada text DEFAULT 'RODIZIO'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_novo_closer_id integer;
  v_novo_closer_nome text;
  v_anterior_id integer;
  v_state RECORD;
  v_dias_ciclo int;
BEGIN
  SELECT COALESCE(NULLIF(valor,'')::int, 180) INTO v_dias_ciclo
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_DIAS_CICLO_CLOSER';

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Cliente não encontrado');
  END IF;

  v_anterior_id := v_customer.vendedor_id;
  v_novo_closer_id := public.fn_proximo_closer(p_customer_id);

  IF v_novo_closer_id IS NULL THEN
    SELECT * INTO v_state FROM public.customer_rotation_state WHERE customer_id = p_customer_id;
    RETURN jsonb_build_object('status', 'skip',
      'message', CASE WHEN v_state.pool_frio THEN 'Cliente foi para pool frio' ELSE 'Nenhum closer elegível' END,
      'customer_id', p_customer_id);
  END IF;

  SELECT name INTO v_novo_closer_nome FROM public.users WHERE id = v_novo_closer_id;

  UPDATE public.customer_ownership_history
  SET data_fim = CURRENT_DATE, motivo_saida = 'EXPIROU_CICLO', execucao_id = p_execucao_id
  WHERE customer_id = p_customer_id AND data_fim IS NULL;

  SELECT * INTO v_state FROM public.customer_rotation_state WHERE customer_id = p_customer_id;

  INSERT INTO public.customer_ownership_history
    (customer_id, company_id, vendedor_id, vendedor_nome, data_inicio, motivo_entrada, ciclo, execucao_id)
  VALUES
    (p_customer_id, v_customer.company_id, v_novo_closer_id, v_novo_closer_nome, CURRENT_DATE,
     p_motivo_entrada, v_state.ciclo_closer, p_execucao_id);

  UPDATE public.customers
  SET vendedor_id = v_novo_closer_id, vendedor_nome = v_novo_closer_nome, data_entrada_carteira = CURRENT_DATE,
      updated_at = now()
  WHERE id = p_customer_id;

  UPDATE public.customer_rotation_state
  SET closers_visitados = array_append(COALESCE(closers_visitados, '{}'), v_anterior_id),
      proxima_rotacao_closer = CURRENT_DATE + v_dias_ciclo,
      updated_at = now()
  WHERE customer_id = p_customer_id;

  INSERT INTO public.customer_events (customer_id, company_id, evento_tipo, data_evento, vendedor_id, dados_extras)
  VALUES (p_customer_id, v_customer.company_id, 'RODIZIO_CLOSER', CURRENT_DATE, v_novo_closer_id,
    jsonb_build_object('anterior_id', v_anterior_id, 'novo_id', v_novo_closer_id, 'ciclo', v_state.ciclo_closer, 'execucao_id', p_execucao_id));

  RETURN jsonb_build_object('status', 'success', 'customer_id', p_customer_id,
    'anterior_id', v_anterior_id, 'novo_id', v_novo_closer_id, 'novo_nome', v_novo_closer_nome);
END;
$function$
