CREATE OR REPLACE FUNCTION public.rodizio_sdr_rotacionar_cliente(p_customer_id uuid, p_execucao_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_novo_sdr_id integer;
  v_novo_sdr_nome text;
  v_anterior_id integer;
  v_dias_ciclo int;
BEGIN
  SELECT COALESCE(NULLIF(valor,'')::int, 180) INTO v_dias_ciclo
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_DIAS_CICLO_SDR';

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Cliente não encontrado');
  END IF;

  v_anterior_id := v_customer.sdr_id;
  v_novo_sdr_id := public.fn_proximo_sdr(p_customer_id);

  IF v_novo_sdr_id IS NULL THEN
    RETURN jsonb_build_object('status', 'skip', 'message', 'Nenhum SDR elegível', 'customer_id', p_customer_id);
  END IF;

  SELECT name INTO v_novo_sdr_nome FROM public.users WHERE id = v_novo_sdr_id;

  UPDATE public.customer_sdr_history
  SET data_fim = CURRENT_DATE, resultado = 'EXPIROU_CICLO'
  WHERE customer_id = p_customer_id AND data_fim IS NULL;

  INSERT INTO public.customer_sdr_history (customer_id, company_id, sdr_id, sdr_nome, data_inicio, data_atribuicao, ciclo, execucao_id)
  SELECT p_customer_id, v_customer.company_id, v_novo_sdr_id, v_novo_sdr_nome, CURRENT_DATE, CURRENT_DATE,
         s.ciclo_sdr, p_execucao_id
  FROM public.customer_rotation_state s WHERE s.customer_id = p_customer_id;

  UPDATE public.customers
  SET sdr_id = v_novo_sdr_id, sdr_nome = v_novo_sdr_nome, data_atribuicao_sdr = CURRENT_DATE, updated_at = now()
  WHERE id = p_customer_id;

  UPDATE public.customer_rotation_state
  SET sdrs_visitados = array_append(COALESCE(sdrs_visitados, '{}'), v_anterior_id),
      proxima_rotacao_sdr = CURRENT_DATE + v_dias_ciclo, updated_at = now()
  WHERE customer_id = p_customer_id;

  INSERT INTO public.customer_events (customer_id, company_id, evento_tipo, data_evento, vendedor_id, dados_extras)
  VALUES (p_customer_id, v_customer.company_id, 'RODIZIO_SDR', CURRENT_DATE, v_novo_sdr_id,
    jsonb_build_object('anterior_id', v_anterior_id, 'novo_id', v_novo_sdr_id, 'execucao_id', p_execucao_id));

  RETURN jsonb_build_object('status', 'success', 'customer_id', p_customer_id, 'anterior_id', v_anterior_id, 'novo_id', v_novo_sdr_id);
END;
$function$
