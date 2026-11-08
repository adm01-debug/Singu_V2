-- Rodízio de Carteira — Bloco 2: Motor
-- Todas as funções abaixo foram testadas em transação com ROLLBACK contra produção
-- (segmentação, anel com fechamento de ciclo e pool frio, rotação transacional,
-- bloqueio com evidência e teto mensal, expiração, executar DRY_RUN/REAL, reverter).
-- Nada roda automaticamente: kill switches RODIZIO_CLOSER_ATIVO/RODIZIO_SDR_ATIVO
-- seguem 'false' (config_regras_negocio, aplicado no Bloco 1).

CREATE OR REPLACE FUNCTION public.fn_segmento_cliente(p_customer_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_state RECORD;
  v_ultimo_pedido date;
  v_dias_protecao int;
BEGIN
  SELECT COALESCE(NULLIF(valor,'')::int, 180) INTO v_dias_protecao
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_DIAS_PROTECAO_POS_PEDIDO';

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_state FROM public.customer_rotation_state WHERE customer_id = p_customer_id;

  IF v_customer.vendedor_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = v_customer.vendedor_id AND u.participa_rodizio_closer
  ) THEN
    RETURN 'FORA_RODIZIO';
  END IF;

  IF FOUND AND v_state.pool_frio THEN
    RETURN 'POOL_FRIO';
  END IF;

  IF FOUND AND v_state.bloqueado_ate IS NOT NULL AND v_state.bloqueado_ate >= CURRENT_DATE THEN
    RETURN 'BLOQUEADO';
  END IF;

  SELECT max(data_pedido) INTO v_ultimo_pedido FROM public.customer_purchases WHERE customer_id = p_customer_id;

  IF v_ultimo_pedido IS NULL THEN
    RETURN 'NAO_ATIVADO';
  END IF;

  IF CURRENT_DATE - v_ultimo_pedido < v_dias_protecao THEN
    RETURN 'ATIVO';
  END IF;

  RETURN 'INATIVO';
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_segmento_cliente(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.fn_carga_atual_closer(p_vendedor_id integer)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN (
    SELECT count(*)::integer
    FROM public.customers c
    WHERE c.vendedor_id = p_vendedor_id
      AND c.deleted_at IS NULL
      AND public.fn_segmento_cliente(c.id) IN ('NAO_ATIVADO', 'INATIVO')
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_carga_atual_closer(integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.fn_proximo_closer(p_customer_id uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_state RECORD;
  v_candidato_id integer;
  v_ciclos_max int;
BEGIN
  SELECT COALESCE(NULLIF(valor,'')::int, 2) INTO v_ciclos_max
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_CICLOS_ATE_POOL_FRIO';

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_state FROM public.customer_rotation_state WHERE customer_id = p_customer_id;
  IF NOT FOUND THEN
    INSERT INTO public.customer_rotation_state (customer_id)
    VALUES (p_customer_id)
    RETURNING * INTO v_state;
  END IF;

  SELECT u.id INTO v_candidato_id
  FROM public.users u
  WHERE u.participa_rodizio_closer AND u.is_active
    AND (u.afastado_ate IS NULL OR u.afastado_ate < CURRENT_DATE)
    AND u.id IS DISTINCT FROM v_customer.vendedor_id
    AND NOT (u.id = ANY(COALESCE(v_state.closers_visitados, '{}')))
    AND (u.capacidade_max IS NULL OR public.fn_carga_atual_closer(u.id) < u.capacidade_max)
  ORDER BY public.fn_carga_atual_closer(u.id) ASC, u.ordem_rodizio ASC NULLS LAST
  LIMIT 1;

  IF v_candidato_id IS NULL THEN
    -- anel fechou: todos os outros já tiveram o cliente
    UPDATE public.customer_rotation_state
    SET ciclo_closer = ciclo_closer + 1, closers_visitados = '{}', updated_at = now()
    WHERE customer_id = p_customer_id
    RETURNING * INTO v_state;

    IF v_state.ciclo_closer > v_ciclos_max THEN
      UPDATE public.customer_rotation_state SET pool_frio = true, updated_at = now()
      WHERE customer_id = p_customer_id;
      RETURN NULL;
    END IF;

    SELECT u.id INTO v_candidato_id
    FROM public.users u
    WHERE u.participa_rodizio_closer AND u.is_active
      AND (u.afastado_ate IS NULL OR u.afastado_ate < CURRENT_DATE)
      AND u.id IS DISTINCT FROM v_customer.vendedor_id
      AND (u.capacidade_max IS NULL OR public.fn_carga_atual_closer(u.id) < u.capacidade_max)
    ORDER BY public.fn_carga_atual_closer(u.id) ASC, u.ordem_rodizio ASC NULLS LAST
    LIMIT 1;
  END IF;

  RETURN v_candidato_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_proximo_closer(uuid) FROM PUBLIC, anon, authenticated;

-- fn_proximo_sdr: espelho, prioriza (não exclusividade) SDRs vinculados ao closer atual via sdr_closer_assignments
CREATE OR REPLACE FUNCTION public.fn_proximo_sdr(p_customer_id uuid)
RETURNS integer
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_state RECORD;
  v_candidato_id integer;
BEGIN
  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE participa_rodizio_sdr AND is_active) THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_state FROM public.customer_rotation_state WHERE customer_id = p_customer_id;
  IF NOT FOUND THEN
    INSERT INTO public.customer_rotation_state (customer_id)
    VALUES (p_customer_id)
    RETURNING * INTO v_state;
  END IF;

  -- prioridade: SDR com vínculo ativo ao closer atual do cliente
  SELECT u.id INTO v_candidato_id
  FROM public.users u
  JOIN public.sdr_closer_assignments a ON a.sdr_id = u.id
  WHERE u.participa_rodizio_sdr AND u.is_active
    AND (u.afastado_ate IS NULL OR u.afastado_ate < CURRENT_DATE)
    AND NOT (u.id = ANY(COALESCE(v_state.sdrs_visitados, '{}')))
    AND a.closer_id = v_customer.vendedor_id
    AND a.ativo
  ORDER BY u.ordem_rodizio ASC NULLS LAST
  LIMIT 1;

  IF v_candidato_id IS NULL THEN
    SELECT u.id INTO v_candidato_id
    FROM public.users u
    WHERE u.participa_rodizio_sdr AND u.is_active
      AND (u.afastado_ate IS NULL OR u.afastado_ate < CURRENT_DATE)
      AND NOT (u.id = ANY(COALESCE(v_state.sdrs_visitados, '{}')))
    ORDER BY u.ordem_rodizio ASC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_candidato_id IS NULL THEN
    UPDATE public.customer_rotation_state
    SET ciclo_sdr = ciclo_sdr + 1, sdrs_visitados = '{}', updated_at = now()
    WHERE customer_id = p_customer_id;

    SELECT u.id INTO v_candidato_id
    FROM public.users u
    WHERE u.participa_rodizio_sdr AND u.is_active
      AND (u.afastado_ate IS NULL OR u.afastado_ate < CURRENT_DATE)
    ORDER BY u.ordem_rodizio ASC NULLS LAST
    LIMIT 1;
  END IF;

  RETURN v_candidato_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.fn_proximo_sdr(uuid) FROM PUBLIC, anon, authenticated;

-- Rotação transacional de um cliente (seção 6)
CREATE OR REPLACE FUNCTION public.rodizio_closer_rotacionar_cliente(
  p_customer_id uuid,
  p_execucao_id uuid DEFAULT NULL,
  p_motivo_entrada text DEFAULT 'RODIZIO'
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_novo_closer_id integer;
  v_novo_closer_nome text;
  v_anterior_id integer;
  v_state RECORD;
  v_dias_ciclo int;
BEGIN
  SELECT COALESCE(NULLIF(valor,'')::int, 180) INTO v_dias_ciclo
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_DIAS_CICLO_CLOSER';

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Cliente não encontrado');
  END IF;

  v_anterior_id := v_customer.vendedor_id;
  v_novo_closer_id := public.fn_proximo_closer(p_customer_id);

  IF v_novo_closer_id IS NULL THEN
    SELECT * INTO v_state FROM public.customer_rotation_state WHERE customer_id = p_customer_id;
    RETURN jsonb_build_object('status', 'skip',
      'message', CASE WHEN v_state.pool_frio THEN 'Cliente foi para pool frio' ELSE 'Nenhum closer elegível' END,
      'customer_id', p_customer_id);
  END IF;

  SELECT name INTO v_novo_closer_nome FROM public.users WHERE id = v_novo_closer_id;

  -- 1. fecha customer_ownership_history aberta
  UPDATE public.customer_ownership_history
  SET data_fim = CURRENT_DATE, motivo_saida = 'EXPIROU_CICLO', execucao_id = p_execucao_id
  WHERE customer_id = p_customer_id AND data_fim IS NULL;

  -- 2. abre nova linha
  SELECT * INTO v_state FROM public.customer_rotation_state WHERE customer_id = p_customer_id;

  INSERT INTO public.customer_ownership_history
    (customer_id, company_id, vendedor_id, vendedor_nome, data_inicio, motivo_entrada, ciclo, execucao_id)
  VALUES
    (p_customer_id, v_customer.company_id, v_novo_closer_id, v_novo_closer_nome, CURRENT_DATE,
     p_motivo_entrada, v_state.ciclo_closer, p_execucao_id);

  -- 3. atualiza customers
  UPDATE public.customers
  SET vendedor_id = v_novo_closer_id, vendedor_nome = v_novo_closer_nome, data_entrada_carteira = CURRENT_DATE,
      updated_at = now()
  WHERE id = p_customer_id;

  -- 4. atualiza rotation_state
  UPDATE public.customer_rotation_state
  SET closers_visitados = array_append(COALESCE(closers_visitados, '{}'), v_anterior_id),
      proxima_rotacao_closer = CURRENT_DATE + v_dias_ciclo,
      updated_at = now()
  WHERE customer_id = p_customer_id;

  -- 5. evento
  INSERT INTO public.customer_events (customer_id, company_id, evento_tipo, data_evento, vendedor_id, dados_extras)
  VALUES (p_customer_id, v_customer.company_id, 'RODIZIO_CLOSER', CURRENT_DATE, v_novo_closer_id,
    jsonb_build_object('anterior_id', v_anterior_id, 'novo_id', v_novo_closer_id, 'ciclo', v_state.ciclo_closer, 'execucao_id', p_execucao_id));

  RETURN jsonb_build_object('status', 'success', 'customer_id', p_customer_id,
    'anterior_id', v_anterior_id, 'novo_id', v_novo_closer_id, 'novo_nome', v_novo_closer_nome);
END;
$function$;

REVOKE ALL ON FUNCTION public.rodizio_closer_rotacionar_cliente(uuid, uuid, text) FROM PUBLIC, anon, authenticated;

-- SDR: rotação espelho (mínima, já que anel está vazio hoje — D6)
CREATE OR REPLACE FUNCTION public.rodizio_sdr_rotacionar_cliente(
  p_customer_id uuid,
  p_execucao_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_novo_sdr_id integer;
  v_novo_sdr_nome text;
  v_anterior_id integer;
  v_dias_ciclo int;
BEGIN
  SELECT COALESCE(NULLIF(valor,'')::int, 180) INTO v_dias_ciclo
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_DIAS_CICLO_SDR';

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Cliente não encontrado');
  END IF;

  v_anterior_id := v_customer.sdr_id;
  v_novo_sdr_id := public.fn_proximo_sdr(p_customer_id);

  IF v_novo_sdr_id IS NULL THEN
    RETURN jsonb_build_object('status', 'skip', 'message', 'Nenhum SDR elegível', 'customer_id', p_customer_id);
  END IF;

  SELECT name INTO v_novo_sdr_nome FROM public.users WHERE id = v_novo_sdr_id;

  UPDATE public.customer_sdr_history
  SET data_fim = CURRENT_DATE, resultado = 'EXPIROU_CICLO'
  WHERE customer_id = p_customer_id AND data_fim IS NULL;

  INSERT INTO public.customer_sdr_history (customer_id, company_id, sdr_id, sdr_nome, data_inicio, data_atribuicao, ciclo, execucao_id)
  SELECT p_customer_id, v_customer.company_id, v_novo_sdr_id, v_novo_sdr_nome, CURRENT_DATE, CURRENT_DATE,
         s.ciclo_sdr, p_execucao_id
  FROM public.customer_rotation_state s WHERE s.customer_id = p_customer_id;

  UPDATE public.customers
  SET sdr_id = v_novo_sdr_id, sdr_nome = v_novo_sdr_nome, data_atribuicao_sdr = CURRENT_DATE, updated_at = now()
  WHERE id = p_customer_id;

  UPDATE public.customer_rotation_state
  SET sdrs_visitados = array_append(COALESCE(sdrs_visitados, '{}'), v_anterior_id),
      proxima_rotacao_sdr = CURRENT_DATE + v_dias_ciclo, updated_at = now()
  WHERE customer_id = p_customer_id;

  INSERT INTO public.customer_events (customer_id, company_id, evento_tipo, data_evento, vendedor_id, dados_extras)
  VALUES (p_customer_id, v_customer.company_id, 'RODIZIO_SDR', CURRENT_DATE, v_novo_sdr_id,
    jsonb_build_object('anterior_id', v_anterior_id, 'novo_id', v_novo_sdr_id, 'execucao_id', p_execucao_id));

  RETURN jsonb_build_object('status', 'success', 'customer_id', p_customer_id, 'anterior_id', v_anterior_id, 'novo_id', v_novo_sdr_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.rodizio_sdr_rotacionar_cliente(uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Bloqueio manual (seção 8)
CREATE OR REPLACE FUNCTION public.rodizio_bloquear_cliente(
  p_customer_id uuid,
  p_dias integer,
  p_motivo text,
  p_solicitado_por_id integer
)
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
$function$;

REVOKE ALL ON FUNCTION public.rodizio_bloquear_cliente(uuid, integer, text, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rodizio_aprovar_bloqueio(p_customer_id uuid, p_aprovado_por_id integer)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  UPDATE public.customer_rotation_state
  SET bloqueio_aprovado_por_id = p_aprovado_por_id, updated_at = now()
  WHERE customer_id = p_customer_id AND bloqueado_ate >= CURRENT_DATE AND bloqueio_aprovado_por_id IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Sem bloqueio pendente de aprovação para este cliente');
  END IF;

  RETURN jsonb_build_object('status', 'success', 'customer_id', p_customer_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.rodizio_aprovar_bloqueio(uuid, integer) FROM PUBLIC, anon, authenticated;

-- expira bloqueios vencidos (job diário, seção 11)
CREATE OR REPLACE FUNCTION public.rodizio_expirar_bloqueios()
RETURNS integer
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_count int;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role' USING ERRCODE = 'insufficient_privilege';
  END IF;

  WITH vencidos AS (
    UPDATE public.customer_rotation_state s
    SET bloqueado_ate = NULL, bloqueio_motivo = NULL, bloqueado_por_id = NULL, bloqueio_aprovado_por_id = NULL, updated_at = now()
    WHERE s.bloqueado_ate IS NOT NULL AND s.bloqueado_ate < CURRENT_DATE
    RETURNING s.customer_id
  )
  INSERT INTO public.customer_events (customer_id, evento_tipo, data_evento)
  SELECT customer_id, 'RODIZIO_DESBLOQUEIO', CURRENT_DATE FROM vencidos;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.rodizio_expirar_bloqueios() FROM PUBLIC, anon, authenticated;

-- Executa a onda de rotação de closers (DRY_RUN simula sem persistir, REAL grava e abre rodizio_execucoes)
CREATE OR REPLACE FUNCTION public.rodizio_closer_executar(p_modo text, p_limit integer DEFAULT 250, p_executado_por_id integer DEFAULT NULL)
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

REVOKE ALL ON FUNCTION public.rodizio_closer_executar(text, integer, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rodizio_sdr_executar(p_modo text, p_limit integer DEFAULT 250, p_executado_por_id integer DEFAULT NULL)
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

REVOKE ALL ON FUNCTION public.rodizio_sdr_executar(text, integer, integer) FROM PUBLIC, anon, authenticated;

-- Segmentação diária: recalcula segmento de toda a carteira (seção 11, job)
CREATE OR REPLACE FUNCTION public.rodizio_segmentar_carteira()
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_count int := 0;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role' USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO public.customer_rotation_state (customer_id, segmento, updated_at)
  SELECT c.id, public.fn_segmento_cliente(c.id), now()
  FROM public.customers c
  WHERE c.deleted_at IS NULL
  ON CONFLICT (customer_id) DO UPDATE SET
    segmento = EXCLUDED.segmento, updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('status', 'success', 'clientes_processados', v_count);
END;
$function$;

REVOKE ALL ON FUNCTION public.rodizio_segmentar_carteira() FROM PUBLIC, anon, authenticated;

-- Reverte uma execução inteira pelo ledger (seção 10, passo 6), usando customer_events
-- como fonte confiável do dono anterior (mais resiliente que casar linhas por data).
CREATE OR REPLACE FUNCTION public.rodizio_reverter_execucao(p_execucao_id uuid, p_revertido_por_id integer DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_exec RECORD;
  v_evento RECORD;
  v_anterior_id integer;
  v_anterior_nome text;
  v_count int := 0;
BEGIN
  SELECT * INTO v_exec FROM public.rodizio_execucoes WHERE id = p_execucao_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Execução não encontrada');
  END IF;
  IF EXISTS (SELECT 1 FROM public.rodizio_execucoes WHERE revertida_por_execucao_id = p_execucao_id) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Execução já revertida');
  END IF;

  FOR v_evento IN
    SELECT * FROM public.customer_events
    WHERE evento_tipo = 'RODIZIO_CLOSER' AND (dados_extras->>'execucao_id')::uuid = p_execucao_id
  LOOP
    v_anterior_id := NULLIF(v_evento.dados_extras->>'anterior_id', '')::integer;

    -- apaga a linha aberta por esta execução
    DELETE FROM public.customer_ownership_history
    WHERE customer_id = v_evento.customer_id AND execucao_id = p_execucao_id AND data_fim IS NULL;

    IF v_anterior_id IS NOT NULL THEN
      -- reabre a linha que esta rotação fechou (mesma execução, data_fim preenchida)
      UPDATE public.customer_ownership_history
      SET data_fim = NULL, motivo_saida = NULL, execucao_id = NULL
      WHERE customer_id = v_evento.customer_id AND execucao_id = p_execucao_id
        AND vendedor_id = v_anterior_id AND data_fim IS NOT NULL;

      SELECT name INTO v_anterior_nome FROM public.users WHERE id = v_anterior_id;
    END IF;

    UPDATE public.customers
    SET vendedor_id = v_anterior_id, vendedor_nome = v_anterior_nome, updated_at = now()
    WHERE id = v_evento.customer_id;

    UPDATE public.customer_rotation_state
    SET closers_visitados = array_remove(closers_visitados, v_anterior_id), updated_at = now()
    WHERE customer_id = v_evento.customer_id;

    v_count := v_count + 1;
  END LOOP;

  INSERT INTO public.rodizio_execucoes (tipo, modo, parametros, executado_por_id, revertida_por_execucao_id)
  VALUES (v_exec.tipo, 'ROLLBACK', jsonb_build_object('execucao_revertida', p_execucao_id), p_revertido_por_id, p_execucao_id);

  RETURN jsonb_build_object('status', 'success', 'clientes_revertidos', v_count);
END;
$function$;

REVOKE ALL ON FUNCTION public.rodizio_reverter_execucao(uuid, integer) FROM PUBLIC, anon, authenticated;
