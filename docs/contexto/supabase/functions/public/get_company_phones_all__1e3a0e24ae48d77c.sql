CREATE OR REPLACE FUNCTION public.get_company_phones_all(p_company_id uuid)
 RETURNS TABLE(phone_id uuid, numero text, numero_normalizado text, tipo text, is_primary boolean, is_whatsapp boolean, departamento text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    SELECT cp.id, cp.numero::TEXT, cp.numero_normalizado::TEXT, cp.phone_type::TEXT, cp.is_primary, cp.is_whatsapp, cp.departamento::TEXT
    FROM company_phones cp
    WHERE cp.company_id = p_company_id
    ORDER BY cp.is_primary DESC, cp.is_whatsapp DESC, cp.created_at DESC;
END;
$function$
