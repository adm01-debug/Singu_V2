CREATE OR REPLACE FUNCTION public.soft_delete_contact(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  UPDATE contacts
  SET deleted_at = now()
  WHERE id = p_contact_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Contato não encontrado ou acesso negado');
  ELSE
    result := jsonb_build_object('success', true, 'contact_id', p_contact_id, 'message', 'Contato removido');
  END IF;
  RETURN result;
END;
$function$
