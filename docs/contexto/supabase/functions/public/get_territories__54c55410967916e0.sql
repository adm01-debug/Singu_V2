CREATE OR REPLACE FUNCTION public.get_territories(p_manager_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(territory_id uuid, territory_name text, manager_name text, states text[], company_count bigint, total_revenue numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name::text,
    p.full_name::text,
    t.states,
    COUNT(DISTINCT ct.company_id),
    COALESCE(SUM(d.valor), 0)
  FROM territories t
  LEFT JOIN profiles p ON p.id = t.manager_id
  LEFT JOIN company_territories ct ON ct.territory_id = t.id
  LEFT JOIN deals d ON d.company_id = ct.company_id AND d.status = 'ganho'
  WHERE t.is_active = true
    AND (p_manager_id IS NULL OR t.manager_id = p_manager_id)
  GROUP BY t.id, t.name, p.full_name, t.states
  ORDER BY t.name;
END;
$function$
