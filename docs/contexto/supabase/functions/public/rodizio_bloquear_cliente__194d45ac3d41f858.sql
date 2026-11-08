CREATE OR REPLACE FUNCTION public.rodizio_bloquear_cliente(p_customer_id uuid, p_dias integer, p_motivo text, p_solicitado_por_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_max_dias int;
  v_max_mes int;
  v_tem_evidencia boolean;
  v_bloqueios_mes int;
  v_aprovado_por integer;
BEGIN
  SELECT COALESCE(NULLIF(valor,'')::int, 60) INTO v_max_dias
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_BLOQUEIO_MAX_DIAS';
  SELECT COALESCE(NULLIF(valor,'')::int, 10) INTO v_max_mes
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_MAX_BLOQUEIOS_MES';

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'CLIENTE_NAO_ENCONTRADO');
  END IF;

  IF p_dias IS NULL OR p_dias <= 0 OR p_dias > v_max_dias THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'DIAS_INVALIDOS', 'max_dias', v_max_dias);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.interactions i
    WHERE i.company_id = v_customer.company_id
      AND i.data_interacao >= now() - interval '30 days'
  ) OR EXISTS (
    SELECT 1 FROM public.sales_opportunities so
    WHERE so.company_id = v_customer.company_id
      AND so.status IN ('identified', 'qualified', 'proposal', 'negotiation', 'on_hold')
  ) INTO v_tem_evidencia;

  IF NOT v_tem_evidencia THEN
    RETURN jsonb_build_object('status', 'error', 'code', 'SEM_EVIDENCIA',
      'message', 'Exige interação nos últimos 30 dias ou oportunidade aberta');
  END IF;

  SELECT count(*) INTO v_bloqueios_mes
  FROM public.customer_events
  WHERE evento_tipo = 'RODIZIO_BLOQUEIO' AND vendedor_id = p_solicitado_por_id
    AND data_evento >= date_trunc('month', CURRENT_DATE);

  v_aprovado_por := CASE WHEN v_bloqueios_mes < v_max_mes THEN p_solicitado_por_id ELSE NULL END;

  INSERT INTO public.customer_rotation_state (customer_id, bloqueado_ate, bloqueio_motivo, bloqueado_por_id, bloqueio_aprovado_por_id, updated_at)
  VALUES (p_customer_id, CURRENT_DATE + p_dias, p_motivo, p_solicitado_por_id, v_aprovado_por, now())
  ON CONFLICT (customer_id) DO UPDATE SET
    bloqueado_ate = CURRENT_DATE + p_dias, bloqueio_motivo = p_motivo,
    bloqueado_por_id = p_solicitado_por_id, bloqueio_aprovado_por_id = v_aprovado_por, updated_at = now();

  INSERT INTO public.customer_events (customer_id, company_id, evento_tipo, data_evento, vendedor_id, motivo, dados_extras)
  VALUES (p_customer_id, v_customer.company_id, 'RODIZIO_BLOQUEIO', CURRENT_DATE, p_solicitado_por_id, p_motivo,
    jsonb_build_object('dias', p_dias, 'aprovado_automaticamente', v_aprovado_por IS NOT NULL));

  RETURN jsonb_build_object('status', 'success', 'bloqueado_ate', CURRENT_DATE + p_dias,
    'pendente_aprovacao', v_aprovado_por IS NULL, 'bloqueios_mes', v_bloqueios_mes + 1);
END;
$function$
