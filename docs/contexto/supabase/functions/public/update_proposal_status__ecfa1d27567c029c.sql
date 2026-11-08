CREATE OR REPLACE FUNCTION public.update_proposal_status(p_proposal_id uuid, p_new_status text, p_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_proposal_access(p_proposal_id);
  UPDATE proposals SET
    status = p_new_status,
    updated_at = NOW(),
    responded_at = CASE WHEN p_new_status IN ('accepted', 'rejected') THEN NOW() ELSE responded_at END,
    sent_at = CASE WHEN p_new_status = 'sent' AND sent_at IS NULL THEN NOW() ELSE sent_at END,
    notes = COALESCE(p_notes, notes)
  WHERE id = p_proposal_id;
  
  RETURN FOUND;
END;
$function$
