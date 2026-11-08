CREATE OR REPLACE FUNCTION public.register_purchase(p_company_id uuid, p_valor numeric, p_pedido_numero text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  affected int;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  UPDATE customers 
  SET 
    ja_comprou = true,
    total_pedidos = COALESCE(total_pedidos, 0) + 1,
    valor_total_compras = COALESCE(valor_total_compras, 0) + p_valor,
    ticket_medio = (COALESCE(valor_total_compras, 0) + p_valor) / (COALESCE(total_pedidos, 0) + 1)
  WHERE company_id = p_company_id AND deleted_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  
  IF affected = 0 THEN
    SELECT jsonb_build_object('success', false, 'message', 'Cliente não encontrado') INTO result;
  ELSE
    SELECT jsonb_build_object(
      'success', true, 
      'company_id', p_company_id, 
      'valor', p_valor,
      'message', 'Compra registrada'
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$function$
