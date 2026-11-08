CREATE OR REPLACE FUNCTION public.list_deleted_companies(p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, nome_crm text, cnpj text, deleted_at timestamp with time zone, dias_deletado integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome_crm,
    c.cnpj,
    c.deleted_at,
    EXTRACT(DAY FROM now() - c.deleted_at)::int as dias_deletado
  FROM companies c
  WHERE c.deleted_at IS NOT NULL
  ORDER BY c.deleted_at DESC
  LIMIT p_limit;
END;
$function$
