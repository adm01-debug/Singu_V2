CREATE OR REPLACE FUNCTION public.get_conversation_history(p_company_id uuid, p_contact_id uuid DEFAULT NULL::uuid, p_channel text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(interaction_id uuid, channel text, direction text, content text, created_at timestamp with time zone, contact_name text, sentiment text, attachments jsonb)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.channel,
    i.direction,
    COALESCE(i.content, i.conteudo, i.resumo),
    i.created_at,
    ct.full_name,
    i.sentiment,
    i.anexos
  FROM interactions i
  LEFT JOIN contacts ct ON ct.id = i.contact_id
  WHERE i.company_id = p_company_id
    AND (p_contact_id IS NULL OR i.contact_id = p_contact_id)
    AND (p_channel IS NULL OR i.channel = p_channel)
  ORDER BY i.created_at DESC
  LIMIT p_limit;
END;
$function$
