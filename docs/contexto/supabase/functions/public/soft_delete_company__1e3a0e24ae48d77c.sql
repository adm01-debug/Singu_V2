CREATE OR REPLACE FUNCTION public.soft_delete_company(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  UPDATE companies
  SET deleted_at = now()
  WHERE id = p_company_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Empresa não encontrada ou acesso negado');
  ELSE
    -- Cascade: contacts/customers belong to this company; no extra auth check needed
    UPDATE contacts  SET deleted_at = now() WHERE company_id = p_company_id AND deleted_at IS NULL;
    UPDATE customers SET deleted_at = now() WHERE company_id = p_company_id AND deleted_at IS NULL;
    result := jsonb_build_object('success', true, 'company_id', p_company_id,
                                 'message', 'Empresa e registros relacionados removidos');
  END IF;
  RETURN result;
END;
$function$
