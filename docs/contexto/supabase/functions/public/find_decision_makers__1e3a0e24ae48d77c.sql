CREATE OR REPLACE FUNCTION public.find_decision_makers(p_company_id uuid)
 RETURNS TABLE(id uuid, nome text, cargo text, email text, telefone text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT ct.id,
         COALESCE(ct.full_name, ct.first_name || ' ' || COALESCE(ct.last_name, '')) as nome,
         ct.cargo,
         (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1) as email,
         (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_primary LIMIT 1) as telefone
  FROM contacts ct
  WHERE ct.company_id = p_company_id
    AND ct.deleted_at IS NULL
    AND ct.cargo IS NOT NULL
    AND (ct.cargo ILIKE '%diretor%' 
      OR ct.cargo ILIKE '%gerente%' 
      OR ct.cargo ILIKE '%presidente%'
      OR ct.cargo ILIKE '%CEO%'
      OR ct.cargo ILIKE '%sócio%'
      OR ct.cargo ILIKE '%proprietário%')
  ORDER BY ct.cargo;
END;
$function$
