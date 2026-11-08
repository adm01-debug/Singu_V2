CREATE OR REPLACE FUNCTION public.search_message_content(p_search_term text, p_company_id uuid DEFAULT NULL::uuid, p_channel text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(interaction_id uuid, company_id uuid, company_name text, channel text, content_excerpt text, created_at timestamp with time zone, direction text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.company_id,
    c.nome_fantasia::TEXT,
    i.channel,
    CASE 
      WHEN LENGTH(COALESCE(i.content, i.conteudo, '')) > 200 
      THEN SUBSTRING(COALESCE(i.content, i.conteudo, '') FROM 1 FOR 200) || '...'
      ELSE COALESCE(i.content, i.conteudo, '')
    END,
    i.created_at,
    i.direction
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  WHERE (
    COALESCE(i.content, '') ILIKE '%' || p_search_term || '%'
    OR COALESCE(i.conteudo, '') ILIKE '%' || p_search_term || '%'
    OR COALESCE(i.resumo, '') ILIKE '%' || p_search_term || '%'
  )
    AND (p_company_id IS NULL OR i.company_id = p_company_id)
    AND (p_channel IS NULL OR i.channel = p_channel)
    AND c.deleted_at IS NULL
  ORDER BY i.created_at DESC
  LIMIT p_limit;
END;
$function$
