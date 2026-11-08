CREATE OR REPLACE FUNCTION public.deactivate_customer(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  affected int;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  UPDATE customers SET cliente_ativado = false WHERE company_id = p_company_id AND deleted_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  
  IF affected = 0 THEN
    SELECT jsonb_build_object('success', false, 'message', 'Cliente não encontrado') INTO result;
  ELSE
    SELECT jsonb_build_object('success', true, 'company_id', p_company_id, 'message', 'Cliente desativado') INTO result;
  END IF;
  
  RETURN result;
END;
$function$
