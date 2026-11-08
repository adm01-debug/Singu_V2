CREATE OR REPLACE FUNCTION public.get_whatsapp_conversation(p_company_id uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(message_id uuid, direction text, content text, message_type text, status text, sent_at timestamp with time zone, contact_name text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT wm.id, wm.direction::text, wm.content::text, wm.message_type::text, wm.status::text, wm.sent_at, c.full_name::text
  FROM whatsapp_messages wm
  LEFT JOIN contacts c ON c.id = wm.contact_id
  WHERE wm.company_id = p_company_id
  ORDER BY wm.sent_at DESC
  LIMIT p_limit;
END;
$function$
