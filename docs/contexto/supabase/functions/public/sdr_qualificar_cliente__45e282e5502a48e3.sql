CREATE OR REPLACE FUNCTION public.sdr_qualificar_cliente(p_customer_id uuid, p_sdr_id integer, p_closer_id integer, p_closer_nome text, p_observacoes text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_sdr_name text;
  v_closer_name text;
  v_actor_name text;
  v_history_id uuid;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role)
          OR (auth.jwt() ->> 'aal') IS DISTINCT FROM 'aal2') THEN
    RAISE EXCEPTION 'Acesso negado: exige admin com MFA ou service_role' USING ERRCODE = '42501';
  END IF;
  IF p_customer_id IS NULL OR p_sdr_id IS NULL OR p_closer_id IS NULL THEN
    RAISE EXCEPTION 'customer_id, SDR e closer são obrigatórios' USING ERRCODE = '22023';
  END IF;
  SELECT c.* INTO v_customer FROM public.customers AS c
  WHERE c.id = p_customer_id AND c.deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não encontrado' USING ERRCODE = 'P0002'; END IF;
  SELECT u.name INTO v_sdr_name FROM public.users AS u
  WHERE u.id = p_sdr_id AND u.is_active AND u.is_sdr;
  IF NOT FOUND THEN RAISE EXCEPTION 'SDR não existe, está inativo ou não possui função SDR' USING ERRCODE = '22023'; END IF;
  SELECT u.name INTO v_closer_name FROM public.users AS u
  WHERE u.id = p_closer_id AND u.is_active
    AND (u.is_vendedor OR u.participa_rodizio_closer);
  IF NOT FOUND THEN RAISE EXCEPTION 'Closer não existe, está inativo ou não possui função de vendedor' USING ERRCODE = '22023'; END IF;
  SELECT COALESCE(NULLIF(btrim(p.full_name), ''), NULLIF(btrim(p.email), ''), 'Sistema')
    INTO v_actor_name FROM public.profiles AS p WHERE p.id = auth.uid();
  v_actor_name := COALESCE(v_actor_name, 'Sistema');
  v_closer_name := COALESCE(NULLIF(btrim(p_closer_nome), ''), v_closer_name);
  UPDATE public.customer_sdr_history SET
    data_fim = CURRENT_DATE,
    resultado = 'QUALIFICADO',
    closer_destino_id = p_closer_id,
    passed_to_closer_id = p_closer_id,
    passed_to_closer_nome = v_closer_name,
    data_passagem_closer = CURRENT_DATE,
    observacoes = COALESCE(NULLIF(btrim(p_observacoes), ''), observacoes),
    updated_at = now()
  WHERE customer_id = p_customer_id AND sdr_id = p_sdr_id AND data_fim IS NULL
  RETURNING id INTO v_history_id;
  IF v_history_id IS NULL THEN
    INSERT INTO public.customer_sdr_history
      (customer_id, company_id, sdr_id, sdr_nome, data_inicio, data_atribuicao,
       data_fim, resultado, closer_destino_id, passed_to_closer_id,
       passed_to_closer_nome, data_passagem_closer, observacoes)
    VALUES
      (p_customer_id, v_customer.company_id, p_sdr_id, v_sdr_name,
       COALESCE(v_customer.data_atribuicao_sdr, CURRENT_DATE), CURRENT_DATE,
       CURRENT_DATE, 'QUALIFICADO', p_closer_id, p_closer_id,
       v_closer_name, CURRENT_DATE, NULLIF(btrim(p_observacoes), ''))
    RETURNING id INTO v_history_id;
  END IF;
  IF v_customer.vendedor_id IS DISTINCT FROM p_closer_id THEN
    UPDATE public.customer_ownership_history SET
      data_fim = CURRENT_DATE, motivo_saida = 'QUALIFICADO_SDR', updated_at = now()
    WHERE customer_id = p_customer_id AND data_fim IS NULL;
    INSERT INTO public.customer_ownership_history
      (customer_id, company_id, vendedor_id, vendedor_nome, data_inicio,
       registrado_por_nome, motivo_entrada, observacoes)
    VALUES
      (p_customer_id, v_customer.company_id, p_closer_id, v_closer_name,
       CURRENT_DATE, v_actor_name, 'QUALIFICADO_SDR', NULLIF(btrim(p_observacoes), ''));
  END IF;
  UPDATE public.customers SET
    sdr_id = p_sdr_id, sdr_nome = v_sdr_name,
    vendedor_id = p_closer_id, vendedor_nome = v_closer_name,
    data_entrada_carteira = CURRENT_DATE, updated_at = now()
  WHERE id = p_customer_id;
  INSERT INTO public.customer_events
    (customer_id, company_id, evento_tipo, data_evento, vendedor_id,
     motivo, observacoes, dados_extras, vendedor_nome, executado_por_nome)
  VALUES
    (p_customer_id, v_customer.company_id, 'QUALIFICADO_SDR', CURRENT_DATE, p_closer_id,
     'QUALIFICADO_SDR', NULLIF(btrim(p_observacoes), ''),
     jsonb_build_object('sdr_id', p_sdr_id, 'sdr_nome', v_sdr_name,
                        'closer_id', p_closer_id, 'closer_nome', v_closer_name,
                        'history_id', v_history_id),
     v_closer_name, v_actor_name);
  RETURN jsonb_build_object('ok', true, 'changed', true, 'customer_id', p_customer_id,
    'sdr_id', p_sdr_id, 'closer_id', p_closer_id, 'history_id', v_history_id,
    'event_type', 'QUALIFICADO_SDR');
END;
$function$
