CREATE OR REPLACE FUNCTION public.get_company_communication_history(p_company_id uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(interaction_id uuid, type text, channel text, resumo text, created_at timestamp with time zone, user_name text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT i.id, i.type, i.channel, i.resumo, i.data_interacao,
    (SELECT COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = i.user_id)
  FROM interactions i WHERE i.company_id = p_company_id ORDER BY i.data_interacao DESC LIMIT p_limit;
$function$
