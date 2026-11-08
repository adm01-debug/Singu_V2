CREATE OR REPLACE FUNCTION public.get_company_proposals(p_company_id uuid, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, titulo text, valor numeric, status text, contato_nome text, criado_em timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT p.id, p.titulo, p.valor, p.status::text,
         COALESCE(ct.full_name, ct.first_name) as contato_nome,
         p.created_at as criado_em
  FROM proposals p
  LEFT JOIN contacts ct ON ct.id = p.contact_id
  WHERE p.company_id = p_company_id
    AND (p_status IS NULL OR p.status::text = p_status)
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$function$
