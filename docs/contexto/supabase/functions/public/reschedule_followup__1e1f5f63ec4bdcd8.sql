CREATE OR REPLACE FUNCTION public.reschedule_followup(p_interaction_id uuid, p_new_date timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  affected int;
BEGIN
  PERFORM public.assert_interaction_access(p_interaction_id);
  UPDATE interactions SET data_followup = p_new_date WHERE id = p_interaction_id AND followup_pendente = true;
  GET DIAGNOSTICS affected = ROW_COUNT;
  
  IF affected = 0 THEN
    SELECT jsonb_build_object('success', false, 'message', 'Followup não encontrado') INTO result;
  ELSE
    SELECT jsonb_build_object('success', true, 'interaction_id', p_interaction_id, 'nova_data', p_new_date) INTO result;
  END IF;
  
  RETURN result;
END;
$function$
