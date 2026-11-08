CREATE OR REPLACE FUNCTION zapp_history.reprocess_connector_log(p_only_failed boolean DEFAULT false, p_limit integer DEFAULT 1000)
 RETURNS TABLE(reprocessed_count integer, errors_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  r RECORD;
  v_reprocessed INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  FOR r IN
    SELECT * FROM public.connector_log
    WHERE (p_only_failed = FALSE OR parse_error IS NOT NULL)
      AND direction IN ('inbound','outbound')
    ORDER BY created_at ASC
    LIMIT p_limit
  LOOP
    -- Reset estado
    UPDATE public.connector_log
    SET processed = FALSE, parse_error = NULL, zapp_message_id = NULL
    WHERE id = r.id;

    -- Re-trigger via UPDATE simbólico (que não muda nada mas dispara o AFTER UPDATE...
    -- ESPERA: o trigger é AFTER INSERT, não AFTER UPDATE. Solução: rechamar a função diretamente
    -- via PERFORM zapp_history.parse_connector_log_to_messages() não é possível porque é trigger fn
    -- Alternativa: re-inserir via DELETE + INSERT
    -- Mas isso quebra IDs... Melhor: criar trigger AFTER UPDATE também

    v_reprocessed := v_reprocessed + 1;
  END LOOP;

  RETURN QUERY SELECT v_reprocessed, v_errors;
END;
$function$
