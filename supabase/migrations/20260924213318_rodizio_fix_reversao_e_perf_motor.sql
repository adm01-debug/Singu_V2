
-- Fix 1: rodizio_aplicar_onda passa a gravar anterior_id em customer_events,
-- para que rodizio_reverter_execucao restaure o vendedor correto (antes zerava vendedor_id).
CREATE OR REPLACE FUNCTION public.rodizio_aplicar_onda(p_onda integer, p_modo text, p_executado_por_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_exec_id uuid;
  v_linha RECORD;
  v_anterior_id integer;
  v_total_aprovados int := 0;
  v_total_aplicados int := 0;
  v_impacto jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
BEGIN
  IF p_modo NOT IN ('DRY_RUN', 'REAL') THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'modo deve ser DRY_RUN ou REAL');
  END IF;

  IF p_modo = 'REAL' THEN
    INSERT INTO public.rodizio_execucoes (tipo, modo, parametros, executado_por_id)
    VALUES ('DISTRIBUICAO_INICIAL', 'REAL', jsonb_build_object('onda', p_onda), p_executado_por_id)
    RETURNING id INTO v_exec_id;
  END IF;

  FOR v_linha IN
    SELECT * FROM public.rodizio_distribuicao_staging
    WHERE onda = p_onda AND status = 'APROVADO'
  LOOP
    v_total_aprovados := v_total_aprovados + 1;

    IF v_linha.closer_destino_id IS NULL THEN
      v_erros := v_erros || jsonb_build_object('customer_id', v_linha.customer_id, 'erro', 'sem closer_destino_id definido');
      CONTINUE;
    END IF;

    IF p_modo = 'DRY_RUN' THEN
      v_impacto := v_impacto || jsonb_build_object(
        'customer_id', v_linha.customer_id, 'closer_destino_id', v_linha.closer_destino_id);
    ELSE
      BEGIN
        SELECT vendedor_id INTO v_anterior_id FROM public.customers WHERE id = v_linha.customer_id;

        UPDATE public.customer_ownership_history
        SET data_fim = CURRENT_DATE, motivo_saida = 'EXPIROU_CICLO', execucao_id = v_exec_id
        WHERE customer_id = v_linha.customer_id AND data_fim IS NULL;

        INSERT INTO public.customer_rotation_state (customer_id) VALUES (v_linha.customer_id)
        ON CONFLICT (customer_id) DO NOTHING;

        INSERT INTO public.customer_ownership_history
          (customer_id, company_id, vendedor_id, vendedor_nome, data_inicio, motivo_entrada, execucao_id)
        SELECT v_linha.customer_id, c.company_id, v_linha.closer_destino_id, u.name, CURRENT_DATE,
               'DISTRIBUICAO_INICIAL', v_exec_id
        FROM public.customers c, public.users u
        WHERE c.id = v_linha.customer_id AND u.id = v_linha.closer_destino_id;

        UPDATE public.customers
        SET vendedor_id = v_linha.closer_destino_id,
            vendedor_nome = (SELECT name FROM public.users WHERE id = v_linha.closer_destino_id),
            data_entrada_carteira = CURRENT_DATE, updated_at = now()
        WHERE id = v_linha.customer_id;

        INSERT INTO public.customer_events (customer_id, company_id, evento_tipo, data_evento, vendedor_id, dados_extras)
        SELECT v_linha.customer_id, c.company_id, 'RODIZIO_CLOSER', CURRENT_DATE, v_linha.closer_destino_id,
               jsonb_build_object('novo_id', v_linha.closer_destino_id, 'anterior_id', v_anterior_id, 'execucao_id', v_exec_id, 'motivo_entrada', 'DISTRIBUICAO_INICIAL')
        FROM public.customers c WHERE c.id = v_linha.customer_id;

        UPDATE public.rodizio_distribuicao_staging
        SET status = 'APLICADO', aplicado_em = now(), execucao_id = v_exec_id
        WHERE id = v_linha.id;

        v_total_aplicados := v_total_aplicados + 1;
        v_impacto := v_impacto || jsonb_build_object('customer_id', v_linha.customer_id, 'closer_destino_id', v_linha.closer_destino_id);
      EXCEPTION WHEN OTHERS THEN
        v_erros := v_erros || jsonb_build_object('customer_id', v_linha.customer_id, 'erro', SQLERRM);
      END;
    END IF;
  END LOOP;

  IF p_modo = 'REAL' THEN
    UPDATE public.rodizio_execucoes
    SET finalizado_em = now(), total_elegiveis = v_total_aprovados, total_rotacionados = v_total_aplicados,
        distribuicao = v_impacto, erros = v_erros
    WHERE id = v_exec_id;
  END IF;

  RETURN jsonb_build_object('status', 'success', 'modo', p_modo, 'onda', p_onda, 'execucao_id', v_exec_id,
    'total_aprovados', v_total_aprovados, 'total_aplicados', v_total_aplicados,
    'impacto', v_impacto, 'erros', v_erros);
END;
$function$;

-- Fix 2: vw_rodizio_execucoes.foi_revertida tinha semântica invertida
-- (marcava a linha de ROLLBACK como revertida, não a execução original revertida).
CREATE OR REPLACE VIEW public.vw_rodizio_execucoes
WITH (security_invoker = true) AS
SELECT e.id,
    e.tipo,
    e.modo,
    e.iniciado_em,
    e.finalizado_em,
    e.total_elegiveis,
    e.total_rotacionados,
    e.executado_por_id,
    u.name AS executado_por_nome,
    e.revertida_por_execucao_id,
    EXISTS (SELECT 1 FROM public.rodizio_execucoes r2 WHERE r2.revertida_por_execucao_id = e.id) AS foi_revertida,
    e.parametros
   FROM (public.rodizio_execucoes e
     LEFT JOIN public.users u ON ((u.id = e.executado_por_id)))
  ORDER BY e.iniciado_em DESC;

REVOKE ALL ON public.vw_rodizio_execucoes FROM PUBLIC, anon;
GRANT SELECT ON public.vw_rodizio_execucoes TO authenticated, service_role;

-- Fix 3: fn_carga_atual_closer fazia N+1 (fn_segmento_cliente por linha, ~869ms/call).
-- Passa a usar customer_rotation_state.segmento (mantido por trg_after_purchase e pelo cron
-- diário singu-rodizio-segmentar já existente), com fallback NAO_ATIVADO igual ao da função original.
CREATE OR REPLACE FUNCTION public.fn_carga_atual_closer(p_vendedor_id integer)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT count(*)::integer
  FROM public.customers c
  LEFT JOIN public.customer_rotation_state s ON s.customer_id = c.id
  WHERE c.vendedor_id = p_vendedor_id
    AND c.deleted_at IS NULL
    AND COALESCE(s.segmento, 'NAO_ATIVADO') IN ('NAO_ATIVADO', 'INATIVO');
$function$;
