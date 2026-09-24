-- Achádo na auditoria: rodizio_reverter_execucao restaurava o vendedor mas não devolvia
-- o status da linha em rodizio_distribuicao_staging de 'APLICADO' pra 'APROVADO', deixando
-- a reversão invisível na staging e impedindo reaplicar a mesma onda sem intervenção manual.

CREATE OR REPLACE FUNCTION public.rodizio_reverter_execucao(p_execucao_id uuid, p_revertido_por_id integer DEFAULT NULL::integer)
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

    DELETE FROM public.customer_ownership_history
    WHERE customer_id = v_evento.customer_id AND execucao_id = p_execucao_id AND data_fim IS NULL;

    IF v_anterior_id IS NOT NULL THEN
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