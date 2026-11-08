CREATE OR REPLACE FUNCTION public.sync_bitrix_company(p_company_id uuid, p_bitrix_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  IF p_bitrix_id IS NOT NULL THEN
    UPDATE companies 
    SET bitrix_company_id = p_bitrix_id,
        bitrix_updated_at = NOW()
    WHERE id = p_company_id;
  END IF;
  
  RETURN jsonb_build_object(
    'company_id', p_company_id,
    'bitrix_id', COALESCE(p_bitrix_id, (SELECT bitrix_company_id FROM companies WHERE id = p_company_id)),
    'synced_at', NOW()
  );
END;
$function$
