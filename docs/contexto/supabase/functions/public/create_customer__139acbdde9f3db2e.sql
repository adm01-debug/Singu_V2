CREATE OR REPLACE FUNCTION public.create_customer(p_company_id uuid, p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  new_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  -- Verificar se já existe
  IF EXISTS (SELECT 1 FROM customers WHERE company_id = p_company_id AND deleted_at IS NULL) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cliente já existe para esta empresa');
  END IF;
  
  INSERT INTO customers (company_id, vendedor_id, cliente_ativado, ja_comprou)
  VALUES (p_company_id, p_vendedor_id, false, false)
  RETURNING id INTO new_id;
  
  SELECT jsonb_build_object(
    'success', true,
    'customer_id', new_id,
    'company_id', p_company_id,
    'message', 'Cliente criado com sucesso'
  ) INTO result;
  
  RETURN result;
END;
$function$
