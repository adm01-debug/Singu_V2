-- Rodízio de Carteira — Bloco 3: Staging + Views
-- Testado em transação com ROLLBACK: sugestão de distribuição para órfãos reais
-- (vendedor 20), DRY_RUN sem aprovar (0), DRY_RUN aprovado (mostra impacto sem
-- persistir), REAL (rotaciona de fato, staging vira APLICADO).

CREATE OR REPLACE VIEW public.vw_rodizio_carga_closers
WITH (security_invoker = true) AS
SELECT
  u.id AS closer_id,
  u.name AS closer_nome,
  u.is_active,
  u.ordem_rodizio,
  u.capacidade_max,
  u.afastado_ate,
  count(c.id) FILTER (WHERE seg.segmento = 'ATIVO') AS total_ativo,
  count(c.id) FILTER (WHERE seg.segmento = 'NAO_ATIVADO') AS total_nao_ativado,
  count(c.id) FILTER (WHERE seg.segmento = 'INATIVO') AS total_inativo,
  count(c.id) FILTER (WHERE seg.segmento = 'BLOQUEADO') AS total_bloqueado,
  count(c.id) FILTER (WHERE seg.segmento = 'POOL_FRIO') AS total_pool_frio,
  count(c.id) FILTER (WHERE seg.segmento IN ('NAO_ATIVADO','INATIVO')) AS carga_atual,
  count(c.id) AS total_carteira
FROM public.users u
LEFT JOIN public.customers c ON c.vendedor_id = u.id AND c.deleted_at IS NULL
LEFT JOIN LATERAL (SELECT public.fn_segmento_cliente(c.id) AS segmento) seg ON c.id IS NOT NULL
WHERE u.participa_rodizio_closer
GROUP BY u.id, u.name, u.is_active, u.ordem_rodizio, u.capacidade_max, u.afastado_ate
ORDER BY u.ordem_rodizio NULLS LAST;

CREATE OR REPLACE VIEW public.vw_rodizio_carga_sdrs
WITH (security_invoker = true) AS
SELECT
  u.id AS sdr_id,
  u.name AS sdr_nome,
  u.is_active,
  u.ordem_rodizio,
  u.capacidade_max,
  u.afastado_ate,
  count(c.id) FILTER (WHERE seg.segmento = 'NAO_ATIVADO') AS total_nao_ativado,
  count(c.id) AS total_carteira
FROM public.users u
LEFT JOIN public.customers c ON c.sdr_id = u.id AND c.deleted_at IS NULL
LEFT JOIN LATERAL (SELECT public.fn_segmento_cliente(c.id) AS segmento) seg ON c.id IS NOT NULL
WHERE u.participa_rodizio_sdr
GROUP BY u.id, u.name, u.is_active, u.ordem_rodizio, u.capacidade_max, u.afastado_ate
ORDER BY u.ordem_rodizio NULLS LAST;

REVOKE ALL ON public.vw_rodizio_carga_closers FROM PUBLIC, anon;
REVOKE ALL ON public.vw_rodizio_carga_sdrs FROM PUBLIC, anon;
GRANT SELECT ON public.vw_rodizio_carga_closers TO authenticated, service_role;
GRANT SELECT ON public.vw_rodizio_carga_sdrs TO authenticated, service_role;

CREATE OR REPLACE VIEW public.vw_rodizio_execucoes
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.tipo,
  e.modo,
  e.iniciado_em,
  e.finalizado_em,
  e.total_elegiveis,
  e.total_rotacionados,
  e.executado_por_id,
  u.name AS executado_por_nome,
  e.revertida_por_execucao_id,
  (e.revertida_por_execucao_id IS NOT NULL) AS foi_revertida,
  e.parametros
FROM public.rodizio_execucoes e
LEFT JOIN public.users u ON u.id = e.executado_por_id
ORDER BY e.iniciado_em DESC;

REVOKE ALL ON public.vw_rodizio_execucoes FROM PUBLIC, anon;
GRANT SELECT ON public.vw_rodizio_execucoes TO authenticated, service_role;

CREATE OR REPLACE VIEW public.vw_rodizio_bloqueios
WITH (security_invoker = true) AS
SELECT
  s.customer_id,
  c.company_id,
  co.nome_crm AS company_nome,
  c.vendedor_id,
  c.vendedor_nome,
  s.bloqueado_ate,
  s.bloqueio_motivo,
  s.bloqueado_por_id,
  ub.name AS bloqueado_por_nome,
  s.bloqueio_aprovado_por_id,
  ua.name AS aprovado_por_nome,
  CASE
    WHEN s.bloqueado_ate IS NULL THEN 'NENHUM'
    WHEN s.bloqueado_ate < CURRENT_DATE THEN 'EXPIRADO'
    WHEN s.bloqueio_aprovado_por_id IS NULL THEN 'PENDENTE_APROVACAO'
    ELSE 'ATIVO'
  END AS status
FROM public.customer_rotation_state s
JOIN public.customers c ON c.id = s.customer_id AND c.deleted_at IS NULL
JOIN public.companies co ON co.id = c.company_id
LEFT JOIN public.users ub ON ub.id = s.bloqueado_por_id
LEFT JOIN public.users ua ON ua.id = s.bloqueio_aprovado_por_id
WHERE s.bloqueado_ate IS NOT NULL
ORDER BY s.bloqueado_ate DESC;

REVOKE ALL ON public.vw_rodizio_bloqueios FROM PUBLIC, anon;
GRANT SELECT ON public.vw_rodizio_bloqueios TO authenticated, service_role;

CREATE OR REPLACE VIEW public.vw_rodizio_kpis
WITH (security_invoker = true) AS
SELECT
  u.id AS closer_id,
  u.name AS closer_nome,
  count(c.id) FILTER (WHERE seg.segmento = 'ATIVO') AS total_ativo,
  count(c.id) FILTER (WHERE seg.segmento = 'NAO_ATIVADO') AS total_nao_ativado,
  count(c.id) FILTER (WHERE seg.segmento = 'INATIVO') AS total_inativo,
  count(c.id) FILTER (WHERE seg.segmento = 'POOL_FRIO') AS total_pool_frio,
  round(
    100.0 * count(c.id) FILTER (WHERE seg.segmento = 'ATIVO')
    / NULLIF(count(c.id), 0), 1
  ) AS taxa_ativacao_pct,
  (SELECT count(*) FROM public.customer_events ev
     WHERE ev.evento_tipo = 'RODIZIO_BLOQUEIO' AND ev.vendedor_id = u.id
       AND ev.data_evento >= date_trunc('month', CURRENT_DATE)) AS bloqueios_mes,
  (SELECT count(*) FROM public.customer_ownership_history h
     WHERE h.vendedor_id = u.id AND h.data_inicio >= CURRENT_DATE - 30) AS clientes_recebidos_30d,
  (SELECT count(*) FROM public.customer_purchases p
     JOIN public.customer_ownership_history h ON h.customer_id = p.customer_id AND h.vendedor_id = u.id
     WHERE p.vendedor_credito_id = u.id AND p.data_pedido >= h.data_inicio AND h.data_fim IS NULL) AS vendas_pos_rotacao
FROM public.users u
LEFT JOIN public.customers c ON c.vendedor_id = u.id AND c.deleted_at IS NULL
LEFT JOIN LATERAL (SELECT public.fn_segmento_cliente(c.id) AS segmento) seg ON c.id IS NOT NULL
WHERE u.participa_rodizio_closer
GROUP BY u.id, u.name, u.ordem_rodizio
ORDER BY u.ordem_rodizio NULLS LAST;

REVOKE ALL ON public.vw_rodizio_kpis FROM PUBLIC, anon;
GRANT SELECT ON public.vw_rodizio_kpis TO authenticated, service_role;

-- Sugere distribuição para uma onda: preenche staging com destino sugerido pelo motor (seção 10)
CREATE OR REPLACE FUNCTION public.rodizio_sugerir_distribuicao(
  p_onda integer,
  p_filtros jsonb DEFAULT '{}'::jsonb,
  p_criado_por_id integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_count int := 0;
  v_sugerido_id integer;
BEGIN
  FOR v_customer IN
    SELECT c.id, c.vendedor_id
    FROM public.customers c
    WHERE c.deleted_at IS NULL
      AND (NOT (p_filtros ? 'vendedor_id') OR c.vendedor_id = (p_filtros->>'vendedor_id')::integer)
      AND (NOT (p_filtros ? 'uf') OR c.id IN (
            SELECT cu.id FROM public.customers cu JOIN public.companies co ON co.id = cu.company_id
            WHERE co.state = p_filtros->>'uf'))
      AND (NOT (p_filtros ? 'ramo_atividade') OR c.ramo_atividade = p_filtros->>'ramo_atividade')
      AND (NOT (p_filtros ? 'grupo_clientes') OR c.grupo_clientes = p_filtros->>'grupo_clientes')
      AND (NOT (p_filtros ? 'valor_min') OR c.valor_total_compras >= (p_filtros->>'valor_min')::numeric)
      AND (NOT (p_filtros ? 'valor_max') OR c.valor_total_compras <= (p_filtros->>'valor_max')::numeric)
      AND (NOT (p_filtros ? 'segmento') OR public.fn_segmento_cliente(c.id) = p_filtros->>'segmento')
      AND NOT EXISTS (
        SELECT 1 FROM public.rodizio_distribuicao_staging st
        WHERE st.onda = p_onda AND st.customer_id = c.id
      )
    LIMIT COALESCE((p_filtros->>'limit')::integer, 5000)
  LOOP
    v_sugerido_id := public.fn_proximo_closer(v_customer.id);

    INSERT INTO public.rodizio_distribuicao_staging
      (onda, customer_id, closer_destino_id, origem, status, criado_por_id)
    VALUES
      (p_onda, v_customer.id, v_sugerido_id, 'SUGESTAO_MOTOR', 'RASCUNHO', p_criado_por_id)
    ON CONFLICT (onda, customer_id) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('status', 'success', 'onda', p_onda, 'clientes_sugeridos', v_count);
END;
$function$;

REVOKE ALL ON FUNCTION public.rodizio_sugerir_distribuicao(integer, jsonb, integer) FROM PUBLIC, anon, authenticated;

-- Aplica a onda aprovada: DRY_RUN mostra impacto, REAL rotaciona de fato (dono definido na staging,
-- não recalcula via fn_proximo_closer — a distribuição inicial já foi curada por quem revisou a onda)
CREATE OR REPLACE FUNCTION public.rodizio_aplicar_onda(
  p_onda integer,
  p_modo text,
  p_executado_por_id integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_exec_id uuid;
  v_linha RECORD;
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
               jsonb_build_object('novo_id', v_linha.closer_destino_id, 'execucao_id', v_exec_id, 'motivo_entrada', 'DISTRIBUICAO_INICIAL')
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

REVOKE ALL ON FUNCTION public.rodizio_aplicar_onda(integer, text, integer) FROM PUBLIC, anon, authenticated;
