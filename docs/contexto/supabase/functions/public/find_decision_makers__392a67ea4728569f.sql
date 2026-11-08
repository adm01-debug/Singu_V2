CREATE OR REPLACE FUNCTION public.find_decision_makers(p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, nome text, cargo text, email text, telefone text, empresa text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT ct.id,
         COALESCE(ct.full_name, ct.first_name) as nome,
         ct.cargo,
         (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1) as email,
         (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_primary LIMIT 1) as telefone,
         COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) as empresa
  FROM contacts ct
  JOIN companies c ON c.id = ct.company_id
  WHERE ct.deleted_at IS NULL
    AND ct.cargo IS NOT NULL
    AND (ct.cargo ILIKE '%diretor%' 
      OR ct.cargo ILIKE '%gerente%' 
      OR ct.cargo ILIKE '%presidente%'
      OR ct.cargo ILIKE '%CEO%'
      OR ct.cargo ILIKE '%sócio%'
      OR ct.cargo ILIKE '%proprietário%')
  ORDER BY ct.cargo
  LIMIT p_limit;
END;
$function$
