CREATE OR REPLACE FUNCTION public.assign_salesperson(p_company_id uuid, p_vendedor_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  affected int;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  UPDATE customers SET vendedor_id = p_vendedor_id WHERE company_id = p_company_id AND deleted_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  
  IF affected = 0 THEN
    SELECT jsonb_build_object('success', false, 'message', 'Cliente não encontrado') INTO result;
  ELSE
    SELECT jsonb_build_object('success', true, 'company_id', p_company_id, 'vendedor_id', p_vendedor_id) INTO result;
  END IF;
  
  RETURN result;
END;
$function$
