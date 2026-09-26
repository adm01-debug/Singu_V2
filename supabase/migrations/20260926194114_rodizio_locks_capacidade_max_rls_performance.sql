
-- Fix 1: rodizio_aplicar_onda passa a reverificar capacidade_max no momento da aplicação
-- (antes só a sugestão do motor respeitava; distribuição manual/CSV podia sobrecarregar closer).
-- Fix 2: pg_advisory_xact_lock em rodizio_aplicar_onda, rodizio_reverter_execucao,
-- rodizio_closer_executar e rodizio_sdr_executar, fechando 3 janelas de corrida
-- (duplo clique/aba dupla aplicando a mesma onda 2x; cron vs manual rodando o mesmo
-- rodízio em paralelo; reversão dupla concorrente corrompendo histórico de posse).
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
  v_capacidade_max int;
  v_carga_atual int;
  v_incrementos jsonb := '{}'::jsonb;
BEGIN
  IF p_modo NOT IN ('DRY_RUN', 'REAL') THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'modo deve ser DRY_RUN ou REAL');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rodizio_aplicar_onda:' || p_onda));

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
        UPDATE public.customer_ownership_history SET data_fim = CURRENT_DATE, motivo_saida = 'EXPIROU_CICLO', execucao_id = v_exec_id WHERE customer_id = v_linha.customer_id AND data_fim IS NULL;
        INSERT INTO public.customer_rotation_state (customer_id) VALUES (v_linha.customer_id) ON CONFLICT (customer_id) DO NOTHING;
        INSERT INTO public.customer_ownership_history (customer_id, company_id, vendedor_id, vendedor_nome, data_inicio, motivo_entrada, execucao_id)
          SELECT v_linha.customer_id, c.company_id, v_linha.closer_destino_id, u.name, CURRENT_DATE, 'DISTRIBUICAO_INICIAL', v_exec_id
          FROM public.customers c, public.users u WHERE c.id = v_linha.customer_id AND u.id = v_linha.closer_destino_id;
        UPDATE public.customers SET vendedor_id = v_linha.closer_destino_id, vendedor_nome = (SELECT name FROM public.users WHERE id = v_linha.closer_destino_id), data_entrada_carteira = CURRENT_DATE, updated_at = now() WHERE id = v_linha.customer_id;
        INSERT INTO public.customer_events (customer_id, company_id, evento_tipo, data_evento, vendedor_id, dados_extras)
          SELECT v_linha.customer_id, c.company_id, 'RODIZIO_CLOSER', CURRENT_DATE, v_linha.closer_destino_id, jsonb_build_object('novo_id', v_linha.closer_destino_id, 'anterior_id', v_anterior_id, 'execucao_id', v_exec_id, 'motivo_entrada', 'DISTRIBUICAO_INICIAL')
          FROM public.customers c WHERE c.id = v_linha.customer_id;
        UPDATE public.rodizio_distribuicao_staging SET status = 'APLICADO', aplicado_em = now(), execucao_id = v_exec_id WHERE id = v_linha.id;
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
    UPDATE public.rodizio_execucoes SET finalizado_em = now(), total_elegiveis = v_total_aprovados, total_rotacionados = v_total_aplicados, distribuicao = v_impacto, erros = v_erros WHERE id = v_exec_id;
  END IF;
  RETURN jsonb_build_object('status', 'success', 'modo', p_modo, 'onda', p_onda, 'execucao_id', v_exec_id, 'total_aprovados', v_total_aprovados, 'total_aplicados', v_total_aplicados, 'impacto', v_impacto, 'erros', v_erros);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rodizio_reverter_execucao(p_execucao_id uuid, p_revertido_por_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_exec RECORD;
  v_evento RECORD;
  v_anterior_id integer;
  v_novo_id integer;
  v_anterior_nome text;
  v_count int := 0;
BEGIN
  SELECT * INTO v_exec FROM public.rodizio_execucoes WHERE id = p_execucao_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Execução não encontrada');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rodizio_execucao:' || p_execucao_id::text));

  IF EXISTS (SELECT 1 FROM public.rodizio_execucoes WHERE revertida_por_execucao_id = p_execucao_id) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Execução já revertida');
  END IF;

  FOR v_evento IN
    SELECT * FROM public.customer_events
    WHERE evento_tipo = 'RODIZIO_CLOSER' AND (dados_extras->>'execucao_id')::uuid = p_execucao_id
  LOOP
    v_anterior_id := NULLIF(v_evento.dados_extras->>'anterior_id', '')::integer;
    v_novo_id := NULLIF(v_evento.dados_extras->>'novo_id', '')::integer;
    v_anterior_nome := NULL;

    DELETE FROM public.customer_ownership_history
    WHERE customer_id = v_evento.customer_id AND vendedor_id IS NOT DISTINCT FROM v_novo_id AND data_fim IS NULL;

    IF v_anterior_id IS NOT NULL THEN
      UPDATE public.customer_ownership_history
      SET data_fim = NULL, motivo_saida = NULL, execucao_id = NULL
      WHERE id = (
        SELECT id FROM public.customer_ownership_history
        WHERE customer_id = v_evento.customer_id AND vendedor_id = v_anterior_id AND data_fim IS NOT NULL
        ORDER BY data_fim DESC, data_inicio DESC
        LIMIT 1
      );

      SELECT name INTO v_anterior_nome FROM public.users WHERE id = v_anterior_id;
    END IF;

    UPDATE public.customers
    SET vendedor_id = v_anterior_id, vendedor_nome = v_anterior_nome, updated_at = now()
    WHERE id = v_evento.customer_id;

    UPDATE public.customer_rotation_state
    SET closers_visitados = array_remove(closers_visitados, v_anterior_id), updated_at = now()
    WHERE customer_id = v_evento.customer_id;

    UPDATE public.rodizio_distribuicao_staging
    SET status = 'APROVADO', aplicado_em = NULL, execucao_id = NULL
    WHERE customer_id = v_evento.customer_id AND execucao_id = p_execucao_id;

    v_count := v_count + 1;
  END LOOP;

  INSERT INTO public.rodizio_execucoes (tipo, modo, parametros, executado_por_id, revertida_por_execucao_id)
  VALUES (v_exec.tipo, 'ROLLBACK', jsonb_build_object('execucao_revertida', p_execucao_id), p_revertido_por_id, p_execucao_id);

  RETURN jsonb_build_object('status', 'success', 'clientes_revertidos', v_count);
END;
$function$;

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
$function$;

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
$function$;

-- Fix 3: performance RLS — envolve has_role(auth.uid(),...) em (select ...) para
-- gerar InitPlan (cache por statement) em vez de reavaliar auth.uid() por linha.
ALTER POLICY company_phones_delete ON public.company_phones USING ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY company_phones_insert ON public.company_phones WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY company_phones_select ON public.company_phones USING ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY company_phones_update ON public.company_phones USING ((select has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));

ALTER POLICY contact_phones_delete ON public.contact_phones USING ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY contact_phones_insert ON public.contact_phones WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY contact_phones_select ON public.contact_phones USING ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY contact_phones_update ON public.contact_phones USING ((select has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));

ALTER POLICY customers_delete ON public.customers USING ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY customers_insert ON public.customers WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY customers_select ON public.customers USING ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY customers_update ON public.customers USING ((select has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));

ALTER POLICY admin_insert ON public.customer_events WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));

ALTER POLICY admin_insert ON public.customer_ownership_history WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY admin_update ON public.customer_ownership_history USING ((select has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));

ALTER POLICY admin_select ON public.customer_purchases USING ((select has_role(auth.uid(), 'admin'::app_role)));

ALTER POLICY admin_insert ON public.customer_rotation_state WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY admin_select ON public.customer_rotation_state USING ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY admin_update ON public.customer_rotation_state USING ((select has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));

ALTER POLICY admin_insert ON public.customer_sdr_history WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY admin_update ON public.customer_sdr_history USING ((select has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));

ALTER POLICY admin_insert ON public.rodizio_distribuicao_staging WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY admin_select ON public.rodizio_distribuicao_staging USING ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY admin_update ON public.rodizio_distribuicao_staging USING ((select has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));

ALTER POLICY admin_insert ON public.rodizio_execucoes WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY admin_select ON public.rodizio_execucoes USING ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY admin_update ON public.rodizio_execucoes USING ((select has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));

ALTER POLICY admin_select ON public.users USING ((select has_role(auth.uid(), 'admin'::app_role)));
ALTER POLICY admin_update ON public.users USING ((select has_role(auth.uid(), 'admin'::app_role))) WITH CHECK ((select has_role(auth.uid(), 'admin'::app_role)));

-- Fix 3: REVOKE do grant table-level solto para anon nas tabelas de PII/rodízio
-- (RLS já restringia por linha, mas o grant amplo era desnecessário e custava lint).
REVOKE ALL ON TABLE public.customers FROM anon;
REVOKE ALL ON TABLE public.contact_phones FROM anon;
REVOKE ALL ON TABLE public.company_phones FROM anon;
REVOKE ALL ON TABLE public.contacts FROM anon;
REVOKE ALL ON TABLE public.companies FROM anon;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.users FROM anon;
