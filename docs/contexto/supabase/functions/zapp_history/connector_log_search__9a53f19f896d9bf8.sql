CREATE OR REPLACE FUNCTION zapp_history.connector_log_search(p_query text)
 RETURNS TABLE(log_id bigint, direction text, whatsapp_number text, push_name text, message_text text, created_at timestamp with time zone, rank real)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    cl.id, cl.direction, cl.whatsapp_number, cl.push_name, cl.message_text, cl.created_at,
    ts_rank(to_tsvector('portuguese', coalesce(cl.message_text,'')), plainto_tsquery('portuguese', p_query)) AS rank
  FROM public.connector_log cl
  WHERE to_tsvector('portuguese', coalesce(cl.message_text,'')) @@ plainto_tsquery('portuguese', p_query)
  ORDER BY rank DESC, cl.created_at DESC
  LIMIT 50;
END;
$function$
