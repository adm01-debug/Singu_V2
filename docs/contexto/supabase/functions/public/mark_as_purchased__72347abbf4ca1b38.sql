CREATE OR REPLACE FUNCTION public.mark_as_purchased(p_company_id uuid, p_valor numeric, p_ticket numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  UPDATE customers SET 
    ja_comprou = true,
    cliente_ativado = true,
    valor_total_compras = COALESCE(valor_total_compras, 0) + p_valor,
    total_pedidos = COALESCE(total_pedidos, 0) + 1,
    ticket_medio = COALESCE(p_ticket, (COALESCE(valor_total_compras, 0) + p_valor) / (COALESCE(total_pedidos, 0) + 1)),
    updated_at = now()
  WHERE company_id = p_company_id AND deleted_at IS NULL;
  
  RETURN jsonb_build_object('success', true, 'company_id', p_company_id, 'valor_adicionado', p_valor);
END;
$function$
