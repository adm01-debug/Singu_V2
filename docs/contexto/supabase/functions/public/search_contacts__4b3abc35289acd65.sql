CREATE OR REPLACE FUNCTION public.search_contacts(search_term text, max_results integer DEFAULT 20)
 RETURNS TABLE(id uuid, full_name text, first_name text, last_name text, company_id uuid)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.full_name,
        c.first_name,
        c.last_name,
        c.company_id
    FROM contacts c
    WHERE 
        c.full_name ILIKE '%' || search_term || '%'
        OR c.first_name ILIKE '%' || search_term || '%'
        OR c.last_name ILIKE '%' || search_term || '%'
    ORDER BY 
        CASE WHEN c.full_name ILIKE search_term || '%' THEN 1 ELSE 2 END,
        c.full_name
    LIMIT max_results;
END;
$function$
