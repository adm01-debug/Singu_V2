CREATE OR REPLACE FUNCTION public.send_proposal(p_proposal_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_proposal_access(p_proposal_id);
  UPDATE proposals 
  SET status = 'enviada', data_envio = NOW(), updated_at = NOW()
  WHERE id = p_proposal_id AND status = 'rascunho';
  
  RETURN FOUND;
END;
$function$
