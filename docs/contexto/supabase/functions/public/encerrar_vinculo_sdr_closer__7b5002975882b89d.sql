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
$function$
