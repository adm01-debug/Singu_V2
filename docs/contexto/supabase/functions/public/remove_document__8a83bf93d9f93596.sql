CREATE OR REPLACE FUNCTION public.remove_document(p_document_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  DELETE FROM documents WHERE id = p_document_id AND user_id = p_user_id;
  RETURN FOUND;
END;
$function$
