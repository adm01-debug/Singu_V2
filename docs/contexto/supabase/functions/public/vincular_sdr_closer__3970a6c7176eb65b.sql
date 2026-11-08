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
$function$
