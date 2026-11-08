CREATE OR REPLACE FUNCTION public.mark_company_reactivated(p_company_id uuid, p_user_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO interactions (company_id, type, channel, direction, resumo, user_id, data_interacao)
  VALUES (p_company_id, 'note', 'system', 'outbound', 'Cliente reativado: ' || COALESCE(p_notes, ''), p_user_id, NOW());
  UPDATE companies SET lead_status = 'reativado' WHERE id = p_company_id;
  RETURN true;
END;
$function$
