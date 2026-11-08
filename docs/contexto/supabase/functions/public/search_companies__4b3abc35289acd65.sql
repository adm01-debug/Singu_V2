CREATE OR REPLACE FUNCTION public.search_companies(search_term text, max_results integer DEFAULT 20)
 RETURNS TABLE(id uuid, nome_fantasia text, razao_social text, cnpj text, status text, is_customer boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.nome_fantasia,
        c.razao_social,
        c.cnpj,
        c.status::TEXT,
        c.is_customer
    FROM companies c
    WHERE 
        c.nome_fantasia ILIKE '%' || search_term || '%'
        OR c.razao_social ILIKE '%' || search_term || '%'
        OR c.cnpj ILIKE '%' || search_term || '%'
    ORDER BY 
        CASE WHEN c.nome_fantasia ILIKE search_term || '%' THEN 1
             WHEN c.razao_social ILIKE search_term || '%' THEN 2
             ELSE 3 END,
        c.nome_fantasia
    LIMIT max_results;
END;
$function$
