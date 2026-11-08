CREATE OR REPLACE FUNCTION public.restore_company(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  UPDATE companies
  SET deleted_at = NULL
  WHERE id = p_company_id
    AND deleted_at IS NOT NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Empresa não encontrada ou acesso negado');
  ELSE
    UPDATE contacts  SET deleted_at = NULL WHERE company_id = p_company_id;
    UPDATE customers SET deleted_at = NULL WHERE company_id = p_company_id;
    result := jsonb_build_object('success', true, 'company_id', p_company_id,
                                 'message', 'Empresa e registros restaurados');
  END IF;
  RETURN result;
END;
$function$
