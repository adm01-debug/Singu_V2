CREATE OR REPLACE FUNCTION public.get_upsell_opportunities(p_min_purchases numeric DEFAULT 5000, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, company_name text, current_value numeric, avg_ticket numeric, purchase_frequency integer, upsell_score numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as company_name,
    cu.valor_total_compras::numeric as current_value,
    cu.ticket_medio::numeric as avg_ticket,
    cu.total_compras::int as purchase_frequency,
    (
      (cu.valor_total_compras / 1000) +
      (cu.total_compras * 10) +
      CASE WHEN cu.ultima_compra >= CURRENT_DATE - 60 THEN 30 ELSE 0 END
    )::numeric as upsell_score
  FROM companies c
  JOIN customers cu ON cu.company_id = c.id
  WHERE c.deleted_at IS NULL
    AND cu.valor_total_compras >= p_min_purchases
    AND cu.cliente_ativado = true
  ORDER BY upsell_score DESC
  LIMIT p_limit;
END;
$function$
