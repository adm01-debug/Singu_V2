CREATE OR REPLACE FUNCTION public.get_win_back_candidates(p_min_value numeric DEFAULT 5000)
 RETURNS TABLE(company_id uuid, name text, last_deal_value numeric, months_since_loss integer, total_historical_revenue numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm),
    (SELECT d.valor FROM deals d WHERE d.company_id = c.id AND d.status = 'perdido' ORDER BY d.closed_at DESC LIMIT 1),
    EXTRACT(MONTH FROM NOW() - (SELECT MAX(d.closed_at) FROM deals d WHERE d.company_id = c.id AND d.status = 'perdido'))::int,
    (SELECT COALESCE(SUM(d.valor), 0) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho')
  FROM companies c WHERE c.deleted_at IS NULL
    AND EXISTS (SELECT 1 FROM deals d WHERE d.company_id = c.id AND d.status = 'perdido' AND d.valor >= p_min_value)
    AND NOT EXISTS (SELECT 1 FROM deals d WHERE d.company_id = c.id AND d.status NOT IN ('ganho', 'perdido'))
  ORDER BY 5 DESC LIMIT 50;
$function$
