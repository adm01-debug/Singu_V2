CREATE OR REPLACE FUNCTION public.search_notes(p_query text, p_limit integer DEFAULT 50)
 RETURNS TABLE(interaction_id uuid, company_id uuid, nome_crm text, nota text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as interaction_id,
    i.company_id,
    c.nome_crm,
    i.resumo_interacao as nota,
    i.created_at
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  WHERE i.tipo_interacao = 'nota'
  AND i.resumo_interacao ILIKE '%' || p_query || '%'
  ORDER BY i.created_at DESC
  LIMIT p_limit;
END;
$function$
