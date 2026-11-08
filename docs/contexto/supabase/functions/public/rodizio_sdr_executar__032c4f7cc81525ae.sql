CREATE OR REPLACE FUNCTION public.rodizio_sdr_executar(p_modo text, p_limit integer DEFAULT 250, p_executado_por_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_exec_id uuid;
  v_customer RECORD;
  v_total_elegiveis int := 0;
  v_total_rotacionados int := 0;
  v_res jsonb;
BEGIN
  IF p_modo NOT IN ('DRY_RUN', 'REAL') THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'modo deve ser DRY_RUN ou REAL');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rodizio_sdr_executar'));

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE participa_rodizio_sdr AND is_active) THEN
    RETURN jsonb_build_object('status', 'success', 'modo', p_modo, 'total_elegiveis', 0, 'total_rotacionados', 0,
      'message', 'Nenhum SDR cadastrado (D6)');
  END IF;

  IF p_modo = 'REAL' THEN
    INSERT INTO public.rodizio_execucoes (tipo, modo, parametros, executado_por_id)
    VALUES ('SDR', 'REAL', jsonb_build_object('limit', p_limit), p_executado_por_id)
    RETURNING id INTO v_exec_id;
  END IF;

  FOR v_customer IN
    SELECT c.id
    FROM public.customers c
    JOIN public.customer_rotation_state s ON s.customer_id = c.id
    WHERE c.deleted_at IS NULL AND s.segmento = 'NAO_ATIVADO'
      AND s.proxima_rotacao_sdr IS NOT NULL AND s.proxima_rotacao_sdr <= CURRENT_DATE
    ORDER BY s.proxima_rotacao_sdr ASC
    LIMIT p_limit
  LOOP
    v_total_elegiveis := v_total_elegiveis + 1;
    IF p_modo = 'REAL' THEN
      v_res := public.rodizio_sdr_rotacionar_cliente(v_customer.id, v_exec_id);
      IF v_res->>'status' = 'success' THEN
        v_total_rotacionados := v_total_rotacionados + 1;
      END IF;
    END IF;
  END LOOP;

  IF p_modo = 'REAL' THEN
    UPDATE public.rodizio_execucoes SET finalizado_em = now(), total_elegiveis = v_total_elegiveis, total_rotacionados = v_total_rotacionados
    WHERE id = v_exec_id;
  END IF;

  RETURN jsonb_build_object('status', 'success', 'modo', p_modo, 'execucao_id', v_exec_id,
    'total_elegiveis', v_total_elegiveis, 'total_rotacionados', v_total_rotacionados);
END;
$function$
