CREATE OR REPLACE FUNCTION public.get_upsell_candidates(p_days integer DEFAULT 90)
 RETURNS TABLE(company_id uuid, name text, last_deal_value numeric, suggested_value numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm),
    (SELECT d.valor FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho' ORDER BY d.closed_at DESC LIMIT 1),
    (SELECT d.valor FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho' ORDER BY d.closed_at DESC LIMIT 1) * 1.3
  FROM companies c WHERE c.is_customer = true AND c.deleted_at IS NULL
  ORDER BY 3 DESC NULLS LAST LIMIT 50;
$function$
