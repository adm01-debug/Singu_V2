CREATE OR REPLACE FUNCTION public.get_contact_details(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'contato', (SELECT row_to_json(ct) FROM contacts ct WHERE ct.id = p_contact_id),
    'empresa', (
      SELECT row_to_json(c) FROM companies c
      JOIN contacts ct ON ct.company_id = c.id
      WHERE ct.id = p_contact_id
    ),
    'cliente', (
      SELECT row_to_json(cu) FROM customers cu
      JOIN contacts ct ON ct.company_id = cu.company_id
      WHERE ct.id = p_contact_id AND cu.deleted_at IS NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
