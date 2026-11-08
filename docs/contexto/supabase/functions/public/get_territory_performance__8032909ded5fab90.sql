CREATE OR REPLACE FUNCTION public.get_territory_performance(p_territory_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'territory_id', t.id,
    'name', t.name,
    'manager', p.full_name,
    'companies', (SELECT COUNT(*) FROM company_territories WHERE territory_id = t.id),
    'active_deals', (SELECT COUNT(*) FROM deals d JOIN company_territories ct ON ct.company_id = d.company_id WHERE ct.territory_id = t.id AND d.status NOT IN ('ganho', 'perdido')),
    'pipeline_value', (SELECT COALESCE(SUM(valor), 0) FROM deals d JOIN company_territories ct ON ct.company_id = d.company_id WHERE ct.territory_id = t.id AND d.status NOT IN ('ganho', 'perdido')),
    'won_deals_month', (SELECT COUNT(*) FROM deals d JOIN company_territories ct ON ct.company_id = d.company_id WHERE ct.territory_id = t.id AND d.status = 'ganho' AND d.closed_at >= DATE_TRUNC('month', CURRENT_DATE)),
    'revenue_month', (SELECT COALESCE(SUM(valor), 0) FROM deals d JOIN company_territories ct ON ct.company_id = d.company_id WHERE ct.territory_id = t.id AND d.status = 'ganho' AND d.closed_at >= DATE_TRUNC('month', CURRENT_DATE))
  ) INTO v_result
  FROM territories t
  LEFT JOIN profiles p ON p.id = t.manager_id
  WHERE t.id = p_territory_id;
  
  RETURN v_result;
END;
$function$
