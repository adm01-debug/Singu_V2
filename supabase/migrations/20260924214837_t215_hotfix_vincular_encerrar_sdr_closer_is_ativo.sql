-- Hotfix de regressão: t214 (hoje) dropou sdr_closer_assignments.is_ativo, mas essas 2 funções
-- (fora da lista de 7 dropadas no t214, achadas só na auditoria) ainda liam/escreviam essa coluna.
-- Confirmado quebrando em produção via query_logs (2 chamadas reais falhando antes deste fix).
-- Causa raiz: ambas migradas para a coluna correta 'ativo' (mesma que fn_proximo_sdr já usa).

CREATE OR REPLACE FUNCTION public.encerrar_vinculo_sdr_closer(p_sdr_id integer, p_closer_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
    UPDATE sdr_closer_assignments SET
        ativo = FALSE,
        data_fim = CURRENT_DATE,
        updated_at = NOW()
    WHERE sdr_id = p_sdr_id AND closer_id = p_closer_id AND ativo = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Vínculo não encontrado');
    END IF;

    RETURN jsonb_build_object('status', 'success', 'message', 'Vínculo encerrado');
END;
$function$;

CREATE OR REPLACE FUNCTION public.vincular_sdr_closer(p_sdr_id integer, p_sdr_nome text, p_closer_id integer, p_closer_nome text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
    IF EXISTS (
        SELECT 1 FROM sdr_closer_assignments
        WHERE sdr_id = p_sdr_id
        AND closer_id = p_closer_id
        AND ativo = true
    ) THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', 'Vínculo SDR-Closer já existe e está ativo'
        );
    END IF;

    INSERT INTO sdr_closer_assignments (
        sdr_id, sdr_nome, closer_id, closer_nome,
        data_inicio, ativo, created_at, updated_at
    ) VALUES (
        p_sdr_id, p_sdr_nome, p_closer_id, p_closer_nome,
        CURRENT_DATE, true, NOW(), NOW()
    );

    RETURN jsonb_build_object(
        'status', 'success',
        'message', 'Vínculo SDR-Closer criado',
        'sdr_id', p_sdr_id,
        'sdr_nome', p_sdr_nome,
        'closer_id', p_closer_id,
        'closer_nome', p_closer_nome
    );
END;
$function$;
