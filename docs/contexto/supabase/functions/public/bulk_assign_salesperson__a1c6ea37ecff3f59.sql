CREATE OR REPLACE FUNCTION public.bulk_assign_salesperson(p_company_ids uuid[], p_vendedor_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  affected int := 0;
BEGIN
  -- Ownership check: caller must own every company in the batch
  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM companies WHERE id = ANY(p_company_ids)
      AND user_id IS DISTINCT FROM auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: one or more companies do not belong to you'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Atualizar customers existentes
  UPDATE customers SET vendedor_id = p_vendedor_id, updated_at = now()
  WHERE company_id = ANY(p_company_ids) AND deleted_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  
  SELECT jsonb_build_object(
    'success', true,
    'vendedor_id', p_vendedor_id,
    'empresas_atualizadas', affected,
    'message', 'Atribuição em massa realizada'
  ) INTO result;
  
  RETURN result;
END;
$function$
