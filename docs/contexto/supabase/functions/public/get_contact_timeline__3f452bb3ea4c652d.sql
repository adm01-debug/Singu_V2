CREATE OR REPLACE FUNCTION public.get_contact_timeline(p_contact_id uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(event_date timestamp with time zone, event_type text, event_title text, event_description text, user_name text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.data_interacao as event_date,
    i.type::text as event_type,
    (i.type || ' - ' || COALESCE(i.channel, 'N/A'))::text as event_title,
    COALESCE(i.resumo, i.content, '')::text as event_description,
    pr.full_name::text as user_name
  FROM interactions i
  LEFT JOIN profiles pr ON pr.id = i.user_id
  WHERE i.contact_id = p_contact_id
  ORDER BY i.data_interacao DESC
  LIMIT p_limit;
END;
$function$
