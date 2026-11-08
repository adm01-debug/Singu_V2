CREATE OR REPLACE FUNCTION public.sync_conversation_status(p_company_id uuid, p_new_status text, p_channel text DEFAULT 'whatsapp'::text)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated INT;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  UPDATE interactions
  SET status = p_new_status,
      updated_at = NOW()
  WHERE company_id = p_company_id
    AND channel = p_channel
    AND status IN ('pendente', 'nao_lido', 'em_andamento');
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$function$
