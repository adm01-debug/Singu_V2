CREATE OR REPLACE FUNCTION public.transfer_portfolio(p_from_vendedor_id integer, p_to_vendedor_id integer, p_company_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  affected int;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF p_company_ids IS NULL THEN
    -- Transfere toda a carteira
    UPDATE customers SET vendedor_id = p_to_vendedor_id WHERE vendedor_id = p_from_vendedor_id AND deleted_at IS NULL;
  ELSE
    -- Transfere apenas os selecionados
    UPDATE customers SET vendedor_id = p_to_vendedor_id WHERE company_id = ANY(p_company_ids) AND vendedor_id = p_from_vendedor_id AND deleted_at IS NULL;
  END IF;
  GET DIAGNOSTICS affected = ROW_COUNT;
  
  SELECT jsonb_build_object(
    'success', true,
    'from_vendedor', p_from_vendedor_id,
    'to_vendedor', p_to_vendedor_id,
    'clientes_transferidos', affected
  ) INTO result;
  
  RETURN result;
END;
$function$
