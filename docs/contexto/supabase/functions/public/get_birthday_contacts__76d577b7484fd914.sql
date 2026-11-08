CREATE OR REPLACE FUNCTION public.get_birthday_contacts(p_days_ahead integer DEFAULT 30)
 RETURNS TABLE(id uuid, nome text, cargo text, email text, telefone text, empresa text, data_nascimento date)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT ct.id,
         COALESCE(ct.full_name, ct.first_name) as nome,
         COALESCE(ct.cargo, '')::text,
         (SELECT COALESCE(ce.email, '')::text FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1),
         (SELECT COALESCE(cp.numero, '')::text FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_primary LIMIT 1),
         COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social, '') as empresa,
         (COALESCE(ct.birthday, ct.data_nascimento))::date as data_nascimento
  FROM contacts ct
  LEFT JOIN companies c ON c.id = ct.company_id
  WHERE ct.deleted_at IS NULL
    AND COALESCE(ct.birthday, ct.data_nascimento) IS NOT NULL
  ORDER BY EXTRACT(MONTH FROM COALESCE(ct.birthday, ct.data_nascimento)),
           EXTRACT(DAY FROM COALESCE(ct.birthday, ct.data_nascimento))
  LIMIT 50;
END;
$function$
