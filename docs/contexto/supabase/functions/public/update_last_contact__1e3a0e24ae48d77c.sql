CREATE OR REPLACE FUNCTION public.update_last_contact(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  UPDATE customers SET 
    ultimo_contato = now(),
    updated_at = now()
  WHERE company_id = p_company_id AND deleted_at IS NULL;
  
  RETURN jsonb_build_object('success', true, 'company_id', p_company_id, 'ultimo_contato', now());
END;
$function$
