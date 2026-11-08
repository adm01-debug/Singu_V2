CREATE OR REPLACE FUNCTION public.get_recoverable_opportunities(p_days integer DEFAULT 180)
 RETURNS TABLE(deal_id uuid, titulo text, valor numeric, company_name text, days_since_lost integer, loss_reason text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT d.id, d.titulo, d.valor, (SELECT COALESCE(c.nome_fantasia, c.nome_crm) FROM companies c WHERE c.id = d.company_id),
    EXTRACT(DAY FROM NOW() - d.closed_at)::int, d.motivo_perda
  FROM deals d WHERE d.status = 'perdido' AND d.closed_at >= NOW() - (p_days || ' days')::interval
    AND d.motivo_perda NOT ILIKE '%concorrente%' AND d.motivo_perda NOT ILIKE '%preço%'
  ORDER BY d.valor DESC LIMIT 50;
$function$
