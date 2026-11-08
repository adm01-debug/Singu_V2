CREATE OR REPLACE FUNCTION public.get_customer_summary(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'company', (SELECT row_to_json(c) FROM companies c WHERE c.id = p_company_id),
    'customer', (SELECT row_to_json(cu) FROM customers cu WHERE cu.company_id = p_company_id),
    'contacts_count', (SELECT COUNT(*) FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL),
    'interactions_count', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id),
    'last_interaction', (SELECT MAX(created_at) FROM interactions WHERE company_id = p_company_id),
    'total_alerts', (SELECT COUNT(*) FROM alerts WHERE company_id = p_company_id),
    'pending_alerts', (SELECT COUNT(*) FROM alerts WHERE company_id = p_company_id AND resolved_at IS NULL)
  ) INTO result;
  
  RETURN result;
END;
$function$
