CREATE OR REPLACE FUNCTION zapp_history.search_contact_messages_semantic(p_contact_id uuid, p_query_embedding vector, p_limit integer DEFAULT 10)
 RETURNS TABLE(message_id uuid, content text, content_type text, similarity numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    me.message_id,
    me.content_text,
    me.content_type,
    (1 - (me.embedding <=> p_query_embedding))::NUMERIC AS similarity,
    m.created_at
  FROM zapp_history.message_embeddings me
  JOIN zapp_history.messages m ON m.id = me.message_id
  WHERE me.contact_id = p_contact_id
  ORDER BY me.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$function$
