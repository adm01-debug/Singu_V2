CREATE OR REPLACE FUNCTION public.get_portfolio_distribution()
 RETURNS TABLE(user_id uuid, user_name text, total_companies bigint, with_interactions bigint, without_interactions bigint, percentage numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total bigint;
BEGIN
  SELECT COUNT(*) INTO v_total FROM companies WHERE deleted_at IS NULL;
  
  RETURN QUERY
  SELECT 
    p.id as user_id,
    COALESCE(p.full_name, p.email)::text as user_name,
    COUNT(DISTINCT c.id)::bigint as total_companies,
    COUNT(DISTINCT c.id) FILTER (WHERE EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id))::bigint as with_interactions,
    COUNT(DISTINCT c.id) FILTER (WHERE NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id))::bigint as without_interactions,
    ROUND(COUNT(DISTINCT c.id) * 100.0 / NULLIF(v_total, 0), 2)::numeric as percentage
  FROM profiles p
  LEFT JOIN companies c ON c.user_id = p.id AND c.deleted_at IS NULL
  WHERE p.is_active = true
  GROUP BY p.id, p.full_name, p.email
  ORDER BY total_companies DESC;
END;
$function$
