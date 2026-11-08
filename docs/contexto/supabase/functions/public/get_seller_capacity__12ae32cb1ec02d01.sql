CREATE OR REPLACE FUNCTION public.get_seller_capacity()
 RETURNS TABLE(user_id uuid, user_name text, open_deals integer, active_companies integer, capacity_score integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT p.id, COALESCE(p.full_name, p.email),
    (SELECT COUNT(*)::int FROM deals d WHERE d.user_id = p.id AND d.status NOT IN ('ganho', 'perdido')),
    (SELECT COUNT(DISTINCT c.id)::int FROM companies c WHERE c.user_id = p.id AND c.deleted_at IS NULL AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '30 days')),
    100 - (SELECT COUNT(*)::int FROM deals d WHERE d.user_id = p.id AND d.status NOT IN ('ganho', 'perdido')) * 5 - 
      (SELECT COUNT(DISTINCT c.id)::int FROM companies c WHERE c.user_id = p.id AND c.deleted_at IS NULL AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '30 days'))
  FROM profiles p WHERE p.is_active = true ORDER BY 5 DESC;
$function$
