CREATE OR REPLACE FUNCTION public.segment_by_purchase_history(p_segment text)
 RETURNS TABLE(company_id uuid, company_name text, total_purchases numeric, last_purchase date, segment_label text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as company_name,
    COALESCE(cu.valor_total_compras, 0)::numeric as total_purchases,
    cu.ultima_compra::date as last_purchase,
    CASE 
      WHEN cu.valor_total_compras >= 100000 THEN 'enterprise'
      WHEN cu.valor_total_compras >= 50000 THEN 'mid_market'
      WHEN cu.valor_total_compras >= 10000 THEN 'smb'
      WHEN cu.valor_total_compras > 0 THEN 'starter'
      ELSE 'prospect'
    END::text as segment_label
  FROM companies c
  LEFT JOIN customers cu ON cu.company_id = c.id
  WHERE c.deleted_at IS NULL
    AND (p_segment IS NULL OR p_segment = '' OR
      CASE 
        WHEN cu.valor_total_compras >= 100000 THEN 'enterprise'
        WHEN cu.valor_total_compras >= 50000 THEN 'mid_market'
        WHEN cu.valor_total_compras >= 10000 THEN 'smb'
        WHEN cu.valor_total_compras > 0 THEN 'starter'
        ELSE 'prospect'
      END = p_segment)
  ORDER BY total_purchases DESC;
END;
$function$
