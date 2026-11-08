CREATE OR REPLACE FUNCTION public.list_contacts_paginated(p_page integer DEFAULT 1, p_page_size integer DEFAULT 20, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  total_count int;
  offset_val int := (p_page - 1) * p_page_size;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM contacts
  WHERE deleted_at IS NULL
  AND (p_company_id IS NULL OR company_id = p_company_id);
  
  SELECT jsonb_build_object(
    'data', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT ct.id, 
               COALESCE(ct.full_name, ct.first_name) as full_name, 
               (SELECT email FROM contact_emails WHERE contact_id = ct.id AND is_primary LIMIT 1) as email,
               (SELECT numero FROM contact_phones WHERE contact_id = ct.id AND is_primary LIMIT 1) as telefone,
               ct.cargo, 
               (SELECT numero FROM contact_phones WHERE contact_id = ct.id AND is_whatsapp LIMIT 1) as whatsapp,
               COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as empresa, 
               ct.created_at
        FROM contacts ct
        JOIN companies c ON c.id = ct.company_id
        WHERE ct.deleted_at IS NULL
        AND (p_company_id IS NULL OR ct.company_id = p_company_id)
        ORDER BY ct.full_name
        LIMIT p_page_size OFFSET offset_val
      ) t
    ),
    'pagination', jsonb_build_object(
      'page', p_page,
      'page_size', p_page_size,
      'total', total_count,
      'total_pages', CEIL(total_count::numeric / p_page_size)::int
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
