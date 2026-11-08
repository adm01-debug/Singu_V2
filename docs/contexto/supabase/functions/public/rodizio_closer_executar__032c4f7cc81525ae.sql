CREATE OR REPLACE FUNCTION public.rodizio_closer_executar(p_modo text, p_limit integer DEFAULT 250, p_executado_por_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_exec_id uuid;
  v_customer RECORD;
  v_total_elegiveis int := 0;
  v_total_rotacionados int := 0;
  v_distribuicao jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_res jsonb;
  v_max_por_closer int;
BEGIN
  IF p_modo NOT IN ('DRY_RUN', 'REAL') THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'modo deve ser DRY_RUN ou REAL');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rodizio_closer_executar'));

  SELECT COALESCE(NULLIF(valor,'')::int, 250) INTO v_max_por_closer
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_MAX_POR_CLOSER_POR_ONDA';

  IF p_modo = 'REAL' THEN
    INSERT INTO public.rodizio_execucoes (tipo, modo, parametros, executado_por_id)
    VALUES ('CLOSER', 'REAL', jsonb_build_object('limit', p_limit), p_executado_por_id)
    RETURNING id INTO v_exec_id;
  END IF;

  FOR v_customer IN
    SELECT c.id, c.vendedor_id
    FROM public.customers c
    JOIN public.customer_rotation_state s ON s.customer_id = c.id
    WHERE c.deleted_at IS NULL
      AND s.segmento IN ('NAO_ATIVADO', 'INATIVO')
      AND s.pool_frio = false
      AND s.proxima_rotacao_closer IS NOT NULL
      AND s.proxima_rotacao_closer <= CURRENT_DATE
    ORDER BY s.proxima_rotacao_closer ASC
    LIMIT p_limit
  LOOP
    v_total_elegiveis := v_total_elegiveis + 1;

    IF p_modo = 'DRY_RUN' THEN
      v_distribuicao := v_distribuicao || jsonb_build_object(
        'customer_id', v_customer.id, 'anterior_id', v_customer.vendedor_id,
        'sugerido_id', public.fn_proximo_closer(v_customer.id));
    ELSE
      BEGIN
        v_res := public.rodizio_closer_rotacionar_cliente(v_customer.id, v_exec_id);
        IF v_res->>'status' = 'success' THEN
          v_total_rotacionados := v_total_rotacionados + 1;
          v_distribuicao := v_distribuicao || v_res;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_erros := v_erros || jsonb_build_object('customer_id', v_customer.id, 'erro', SQLERRM);
      END;
    END IF;
  END LOOP;

  IF p_modo = 'REAL' THEN
    UPDATE public.rodizio_execucoes
    SET finalizado_em = now(), total_elegiveis = v_total_elegiveis, total_rotacionados = v_total_rotacionados,
        distribuicao = v_distribuicao, erros = v_erros
    WHERE id = v_exec_id;
  END IF;

  RETURN jsonb_build_object('status', 'success', 'modo', p_modo, 'execucao_id', v_exec_id,
    'total_elegiveis', v_total_elegiveis, 'total_rotacionados', v_total_rotacionados,
    'distribuicao', v_distribuicao, 'erros', v_erros);
END;
$function$
