CREATE OR REPLACE FUNCTION public.resolver_alertas_por_compra(p_customer_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_count INTEGER;
BEGIN
  PERFORM public.assert_customer_access(p_customer_id);
    UPDATE alertas_inativacao
    SET 
        status = 'RESOLVIDO',
        resolvido_em = NOW(),
        observacao_resolucao = 'Resolvido automaticamente: cliente realizou nova compra',
        updated_at = NOW()
    WHERE customer_id = p_customer_id
      AND status IN ('PENDENTE', 'VISTO', 'EM_ANDAMENTO');
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$function$
