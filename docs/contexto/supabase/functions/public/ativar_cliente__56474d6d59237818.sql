CREATE OR REPLACE FUNCTION public.ativar_cliente(p_customer_id uuid, p_executado_por_id integer, p_executado_por_nome text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_event text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role)
          OR (auth.jwt() ->> 'aal') IS DISTINCT FROM 'aal2') THEN
    RAISE EXCEPTION 'Acesso negado: exige admin com MFA ou service_role' USING ERRCODE = '42501';
  END IF;
  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'customer_id obrigatório' USING ERRCODE = '22023';
  END IF;
  SELECT c.* INTO v_customer FROM public.customers AS c
  WHERE c.id = p_customer_id AND c.deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não encontrado' USING ERRCODE = 'P0002'; END IF;
  IF COALESCE(v_customer.cliente_ativado, false) THEN
    RETURN jsonb_build_object('ok', true, 'changed', false, 'customer_id', p_customer_id,
      'event_type', NULL, 'message', 'Cliente já estava ativo');
  END IF;
  v_event := CASE WHEN v_customer.data_inativacao IS NOT NULL OR COALESCE(v_customer.ja_comprou, false)
                  THEN 'REATIVACAO' ELSE 'ATIVACAO' END;
  UPDATE public.customers SET
    cliente_ativado = true,
    data_ativacao = CURRENT_DATE,
    ativado_por = COALESCE(NULLIF(btrim(p_executado_por_nome), ''), 'Sistema'),
    primeiro_ativador_id = COALESCE(primeiro_ativador_id, p_executado_por_id),
    primeiro_ativador_nome = COALESCE(primeiro_ativador_nome,
      NULLIF(btrim(p_executado_por_nome), ''), 'Sistema'),
    data_primeira_ativacao = COALESCE(data_primeira_ativacao, CURRENT_DATE),
    data_inativacao = NULL,
    inativado_por_id = NULL,
    inativado_por_nome = NULL,
    motivo_inativacao = NULL,
    updated_at = now()
  WHERE id = p_customer_id;
  INSERT INTO public.customer_events
    (customer_id, company_id, evento_tipo, data_evento, vendedor_id,
     executado_por_id, motivo, observacoes, dados_extras, vendedor_nome, executado_por_nome)
  VALUES
    (p_customer_id, v_customer.company_id, v_event, CURRENT_DATE, v_customer.vendedor_id,
     p_executado_por_id, v_event, NULL, jsonb_build_object('source', p_executado_por_nome),
     v_customer.vendedor_nome, p_executado_por_nome);
  RETURN jsonb_build_object('ok', true, 'changed', true, 'customer_id', p_customer_id,
    'event_type', v_event, 'activated_at', CURRENT_DATE);
END;
$function$
