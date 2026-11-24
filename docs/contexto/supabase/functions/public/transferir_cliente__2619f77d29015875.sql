CREATE OR REPLACE FUNCTION public.transferir_cliente(p_customer_id uuid, p_novo_vendedor_id integer, p_novo_vendedor_nome text, p_executado_por_id integer, p_executado_por_nome text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_new_name text;
  v_old_name text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role)
          OR (auth.jwt() ->> 'aal') IS DISTINCT FROM 'aal2') THEN
    RAISE EXCEPTION 'Acesso negado: exige admin com MFA ou service_role' USING ERRCODE = '42501';
  END IF;
  IF p_customer_id IS NULL OR p_novo_vendedor_id IS NULL THEN
    RAISE EXCEPTION 'customer_id e novo vendedor obrigatórios' USING ERRCODE = '22023';
  END IF;
  SELECT c.* INTO v_customer FROM public.customers AS c
  WHERE c.id = p_customer_id AND c.deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não encontrado' USING ERRCODE = 'P0002'; END IF;
  SELECT u.name INTO v_new_name FROM public.users AS u
  WHERE u.id = p_novo_vendedor_id AND u.is_active
    AND (u.is_vendedor OR u.participa_rodizio_closer);
  IF NOT FOUND THEN RAISE EXCEPTION 'Novo vendedor não existe, está inativo ou não é closer' USING ERRCODE = '22023'; END IF;
  v_new_name := COALESCE(NULLIF(btrim(p_novo_vendedor_nome), ''), v_new_name);
  IF v_customer.vendedor_id IS NOT DISTINCT FROM p_novo_vendedor_id THEN
    RETURN jsonb_build_object('ok', true, 'changed', false, 'customer_id', p_customer_id,
      'vendedor_id', p_novo_vendedor_id, 'message', 'Cliente já pertence ao vendedor informado');
  END IF;
  SELECT u.name INTO v_old_name FROM public.users AS u WHERE u.id = v_customer.vendedor_id;
  UPDATE public.customer_ownership_history SET
    data_fim = CURRENT_DATE,
    motivo_saida = 'TRANSFERENCIA',
    updated_at = now()
  WHERE customer_id = p_customer_id AND data_fim IS NULL;
  INSERT INTO public.customer_ownership_history
    (customer_id, company_id, vendedor_id, vendedor_nome, data_inicio,
     registrado_por_id, registrado_por_nome, motivo_entrada, observacoes)
  VALUES
    (p_customer_id, v_customer.company_id, p_novo_vendedor_id, v_new_name, CURRENT_DATE,
     p_executado_por_id, p_executado_por_nome, 'TRANSFERENCIA',
     concat_ws(' | ', NULLIF(btrim(p_executado_por_nome), ''), NULLIF(v_old_name, '')));
  UPDATE public.customers SET
    vendedor_id = p_novo_vendedor_id,
    vendedor_nome = v_new_name,
    data_entrada_carteira = CURRENT_DATE,
    updated_at = now()
  WHERE id = p_customer_id;
  INSERT INTO public.customer_events
    (customer_id, company_id, evento_tipo, data_evento, vendedor_id,
     executado_por_id, motivo, observacoes, dados_extras, vendedor_nome, executado_por_nome)
  VALUES
    (p_customer_id, v_customer.company_id, 'TRANSFERENCIA', CURRENT_DATE, p_novo_vendedor_id,
     p_executado_por_id, 'TRANSFERENCIA', p_executado_por_nome,
     jsonb_build_object('from_vendedor_id', v_customer.vendedor_id,
                        'from_vendedor_nome', v_old_name,
                        'to_vendedor_id', p_novo_vendedor_id,
                        'to_vendedor_nome', v_new_name),
     v_new_name, p_executado_por_nome);
  RETURN jsonb_build_object('ok', true, 'changed', true, 'customer_id', p_customer_id,
    'from_vendedor_id', v_customer.vendedor_id, 'to_vendedor_id', p_novo_vendedor_id,
    'event_type', 'TRANSFERENCIA');
END;
$function$
