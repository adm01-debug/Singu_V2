-- Rodízio de Carteira — correções encontradas na 2ª rodada de auditoria exaustiva
-- (5 agentes), já aplicadas em produção via apply_migration. Este arquivo registra
-- as mesmas mudanças no histórico do repo.

-- Fix 1: rodizio_reverter_execucao — 2 bugs pré-existentes encontrados na auditoria:
-- (a) v_anterior_nome não era resetado por iteração do loop, "grudando" o nome do
--     cliente anterior quando o cliente seguinte tinha anterior_id NULL.
-- (b) reversão de ondas encadeadas no mesmo cliente deixava linha órfã em
--     customer_ownership_history: o UPDATE de reabertura zerava execucao_id da
--     linha, quebrando a correlação que uma reversão mais antiga (de uma onda
--     anterior) precisava para localizar sua própria linha via execucao_id.
--     Corrigido: DELETE e reabertura agora casam por vendedor_id (novo_id/anterior_id
--     do próprio evento) em vez de depender de execucao_id, que pode ser sobrescrito
--     por uma reversão mais recente.
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

-- Fix 2: rodizio_sugerir_distribuicao fazia N+1 (fn_segmento_cliente por linha quando
-- o filtro 'segmento' era usado). Passa a usar customer_rotation_state.segmento
-- (agora populado pelo cron singu-rodizio-segmentar), mesma técnica do fix anterior
-- em fn_carga_atual_closer.
CREATE OR REPLACE FUNCTION public.rodizio_sugerir_distribuicao(p_onda integer, p_filtros jsonb DEFAULT '{}'::jsonb, p_criado_por_id integer DEFAULT NULL::integer)
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
    LEFT JOIN public.customer_rotation_state crs ON crs.customer_id = c.id
    WHERE c.deleted_at IS NULL
      AND (NOT (p_filtros ? 'vendedor_id') OR c.vendedor_id = (p_filtros->>'vendedor_id')::integer)
      AND (NOT (p_filtros ? 'uf') OR c.id IN (
            SELECT cu.id FROM public.customers cu JOIN public.companies co ON co.id = cu.company_id
            WHERE co.state = p_filtros->>'uf'))
      AND (NOT (p_filtros ? 'ramo_atividade') OR c.ramo_atividade = p_filtros->>'ramo_atividade')
      AND (NOT (p_filtros ? 'grupo_clientes') OR c.grupo_clientes = p_filtros->>'grupo_clientes')
      AND (NOT (p_filtros ? 'valor_min') OR c.valor_total_compras >= (p_filtros->>'valor_min')::numeric)
      AND (NOT (p_filtros ? 'valor_max') OR c.valor_total_compras <= (p_filtros->>'valor_max')::numeric)
      AND (NOT (p_filtros ? 'segmento') OR COALESCE(crs.segmento, 'NAO_ATIVADO') = p_filtros->>'segmento')
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
