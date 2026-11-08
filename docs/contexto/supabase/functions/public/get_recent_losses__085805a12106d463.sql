CREATE OR REPLACE FUNCTION public.get_recent_losses(p_days integer DEFAULT 30, p_limit integer DEFAULT 20)
 RETURNS TABLE(deal_id uuid, titulo text, company_name text, valor numeric, motivo text, seller_name text, closed_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT d.id, d.titulo, COALESCE(c.nome_fantasia, c.nome_crm), d.valor, d.motivo_perda,
    (SELECT COALESCE(p.full_name, p.email) FROM profiles p WHERE p.id = d.user_id),
    d.closed_at
  FROM deals d
  LEFT JOIN companies c ON c.id = d.company_id
  WHERE d.status = 'perdido' AND d.closed_at >= NOW() - (p_days || ' days')::interval
  ORDER BY d.closed_at DESC LIMIT p_limit;
$function$
