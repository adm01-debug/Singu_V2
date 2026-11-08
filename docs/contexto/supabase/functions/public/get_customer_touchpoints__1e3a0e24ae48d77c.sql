CREATE OR REPLACE FUNCTION public.get_customer_touchpoints(p_company_id uuid)
 RETURNS TABLE(touchpoint_date date, touchpoint_type text, channel text, summary text, user_name text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT data_interacao::date, type, channel, LEFT(COALESCE(resumo, content), 100),
    (SELECT COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = i.user_id)
  FROM interactions i WHERE i.company_id = p_company_id
  ORDER BY data_interacao DESC LIMIT 50;
$function$
