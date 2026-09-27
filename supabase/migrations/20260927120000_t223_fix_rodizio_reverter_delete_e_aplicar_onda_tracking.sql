-- t223: Fix rodizio_reverter_execucao (DELETE policy) e rodizio_aplicar_onda (rotation tracking)
--
-- Bug 1: customer_ownership_history tinha INSERT+UPDATE para admin mas não DELETE.
-- rodizio_reverter_execucao (SECURITY INVOKER) faz DELETE nessa tabela; sem policy de
-- DELETE para authenticated o RLS bloqueava silenciosamente, deixando 2 linhas de
-- propriedade abertas após cada reversão (execucao_id corrompido).
--
-- Bug 2: rodizio_aplicar_onda inseria customer_rotation_state com ON CONFLICT DO NOTHING
-- mas nunca definia proxima_rotacao_closer. O cron usa proxima_rotacao_closer <= CURRENT_DATE
-- para selecionar clientes a rodar — NULL jamais satisfaz essa condição, então clientes
-- distribuídos via onda inicial nunca entravam no rodízio recorrente.
--
-- Fix 1: CREATE POLICY admin_delete em customer_ownership_history (crítico para reverter),
-- customer_rotation_state, rodizio_distribuicao_staging, customer_sdr_history
-- (consistência com padrão admin-only). rodizio_execucoes e customer_events são logs
-- de auditoria — sem DELETE policy intencional.
-- Padrão InitPlan: (SELECT has_role((SELECT auth.uid() AS uid), ...)) — já em uso nas
-- demais policies dessas tabelas após PR #73.
--
-- Fix 2: rodizio_aplicar_onda lê RODIZIO_DIAS_CICLO_CLOSER e, após cada distribuição REAL,
-- define proxima_rotacao_closer = CURRENT_DATE + v_dias_ciclo e reseta closers_visitados = {}
-- para que o cron selecione o cliente no ciclo correto.

-- Fix 1a: DELETE crítico — rodizio_reverter_execucao volta a funcionar
CREATE POLICY admin_delete ON public.customer_ownership_history
  FOR DELETE TO authenticated
  USING ((SELECT has_role((SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role));

-- Fix 1b: consistência admin-only nas tabelas do domínio rodízio
CREATE POLICY admin_delete ON public.customer_rotation_state
  FOR DELETE TO authenticated
  USING ((SELECT has_role((SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role));

CREATE POLICY admin_delete ON public.rodizio_distribuicao_staging
  FOR DELETE TO authenticated
  USING ((SELECT has_role((SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role));

CREATE POLICY admin_delete ON public.customer_sdr_history
  FOR DELETE TO authenticated
  USING ((SELECT has_role((SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role));

-- Fix 2: rodizio_aplicar_onda com tracking de proxima_rotacao_closer
CREATE OR REPLACE FUNCTION public.rodizio_aplicar_onda(
  p_onda integer,
  p_modo text,
  p_executado_por_id integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_exec_id uuid;
  v_linha RECORD;
  v_anterior_id integer;
  v_total_aprovados int := 0;
  v_total_aplicados int := 0;
  v_impacto jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_capacidade_max int;
  v_carga_atual int;
  v_incrementos jsonb := '{}'::jsonb;
  v_dias_ciclo int;
BEGIN
  IF p_modo NOT IN ('DRY_RUN', 'REAL') THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'modo deve ser DRY_RUN ou REAL');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rodizio_aplicar_onda:' || p_onda));

  SELECT COALESCE(NULLIF(valor, '')::int, 180) INTO v_dias_ciclo
  FROM public.config_regras_negocio WHERE chave = 'RODIZIO_DIAS_CICLO_CLOSER';
  v_dias_ciclo := COALESCE(v_dias_ciclo, 180);

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

    SELECT capacidade_max INTO v_capacidade_max FROM public.users WHERE id = v_linha.closer_destino_id;
    IF v_capacidade_max IS NOT NULL THEN
      v_carga_atual := public.fn_carga_atual_closer(v_linha.closer_destino_id)
        + COALESCE((v_incrementos ->> v_linha.closer_destino_id::text)::int, 0);
      IF v_carga_atual >= v_capacidade_max THEN
        v_erros := v_erros || jsonb_build_object('customer_id', v_linha.customer_id,
          'erro', format('capacidade_max do closer %s excedida (%s/%s)', v_linha.closer_destino_id, v_carga_atual, v_capacidade_max));
        CONTINUE;
      END IF;
    END IF;

    IF p_modo = 'DRY_RUN' THEN
      v_impacto := v_impacto || jsonb_build_object('customer_id', v_linha.customer_id, 'closer_destino_id', v_linha.closer_destino_id);
      v_incrementos := jsonb_set(v_incrementos, ARRAY[v_linha.closer_destino_id::text],
        to_jsonb(COALESCE((v_incrementos ->> v_linha.closer_destino_id::text)::int, 0) + 1));
    ELSE
      BEGIN
        SELECT vendedor_id INTO v_anterior_id FROM public.customers WHERE id = v_linha.customer_id;
        UPDATE public.customer_ownership_history
        SET data_fim = CURRENT_DATE, motivo_saida = 'EXPIROU_CICLO', execucao_id = v_exec_id
        WHERE customer_id = v_linha.customer_id AND data_fim IS NULL;
        INSERT INTO public.customer_rotation_state (customer_id)
        VALUES (v_linha.customer_id)
        ON CONFLICT (customer_id) DO NOTHING;
        UPDATE public.customer_rotation_state
        SET closers_visitados = '{}',
            proxima_rotacao_closer = CURRENT_DATE + v_dias_ciclo,
            updated_at = now()
        WHERE customer_id = v_linha.customer_id;
        INSERT INTO public.customer_ownership_history (customer_id, company_id, vendedor_id, vendedor_nome, data_inicio, motivo_entrada, execucao_id)
          SELECT v_linha.customer_id, c.company_id, v_linha.closer_destino_id, u.name, CURRENT_DATE, 'DISTRIBUICAO_INICIAL', v_exec_id
          FROM public.customers c, public.users u WHERE c.id = v_linha.customer_id AND u.id = v_linha.closer_destino_id;
        UPDATE public.customers
        SET vendedor_id = v_linha.closer_destino_id,
            vendedor_nome = (SELECT name FROM public.users WHERE id = v_linha.closer_destino_id),
            data_entrada_carteira = CURRENT_DATE,
            updated_at = now()
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
        v_incrementos := jsonb_set(v_incrementos, ARRAY[v_linha.closer_destino_id::text],
          to_jsonb(COALESCE((v_incrementos ->> v_linha.closer_destino_id::text)::int, 0) + 1));
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
    'total_aprovados', v_total_aprovados, 'total_aplicados', v_total_aplicados, 'impacto', v_impacto, 'erros', v_erros);
END;
$$;
