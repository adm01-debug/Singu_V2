CREATE OR REPLACE FUNCTION public.inativar_cliente(p_customer_id uuid, p_motivo text, p_executado_por_id integer, p_executado_por_nome text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_reason text := NULLIF(btrim(p_motivo), '');
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role)
          OR (auth.jwt() ->> 'aal') IS DISTINCT FROM 'aal2') THEN
    RAISE EXCEPTION 'Acesso negado: exige admin com MFA ou service_role' USING ERRCODE = '42501';
  END IF;
  IF p_customer_id IS NULL OR v_reason IS NULL THEN
    RAISE EXCEPTION 'customer_id e motivo obrigatório' USING ERRCODE = '22023';
  END IF;
  SELECT c.* INTO v_customer FROM public.customers AS c
  WHERE c.id = p_customer_id AND c.deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente não encontrado' USING ERRCODE = 'P0002'; END IF;
  IF NOT COALESCE(v_customer.cliente_ativado, false) THEN
    RETURN jsonb_build_object('ok', true, 'changed', false, 'customer_id', p_customer_id,
      'event_type', NULL, 'message', 'Cliente já estava inativo');
  END IF;
  UPDATE public.customers SET
    cliente_ativado = false,
    data_inativacao = CURRENT_DATE,
    inativado_por_id = p_executado_por_id,
    inativado_por_nome = COALESCE(NULLIF(btrim(p_executado_por_nome), ''), 'Sistema'),
    motivo_inativacao = v_reason,
    updated_at = now()
  WHERE id = p_customer_id;
  INSERT INTO public.customer_events
    (customer_id, company_id, evento_tipo, data_evento, vendedor_id,
     executado_por_id, motivo, observacoes, dados_extras, vendedor_nome, executado_por_nome)
  VALUES
    (p_customer_id, v_customer.company_id, 'INATIVACAO', CURRENT_DATE, v_customer.vendedor_id,
     p_executado_por_id, v_reason, v_reason, jsonb_build_object('previous_active', true),
     v_customer.vendedor_nome, p_executado_por_nome);
  RETURN jsonb_build_object('ok', true, 'changed', true, 'customer_id', p_customer_id,
    'event_type', 'INATIVACAO', 'reason', v_reason);
END;
$function$
