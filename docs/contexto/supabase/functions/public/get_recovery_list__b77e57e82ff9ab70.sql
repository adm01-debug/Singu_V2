CREATE OR REPLACE FUNCTION public.get_recovery_list(p_days_inactive integer DEFAULT 60, p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, nome_crm text, vendedor_nome text, valor_total_compras numeric, ultima_interacao timestamp with time zone, dias_inativo integer, contatos integer, priority text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    c.nome_crm,
    s.nome as vendedor_nome,
    cu.valor_total_compras,
    (SELECT MAX(i.created_at) FROM interactions i WHERE i.company_id = c.id) as ultima_interacao,
    EXTRACT(DAY FROM now() - (SELECT MAX(i.created_at) FROM interactions i WHERE i.company_id = c.id))::int as dias_inativo,
    (SELECT COUNT(*)::int FROM contacts ct WHERE ct.company_id = c.id AND ct.deleted_at IS NULL) as contatos,
    CASE 
      WHEN cu.valor_total_compras > 10000 THEN 'alta'
      WHEN cu.valor_total_compras > 1000 THEN 'media'
      ELSE 'baixa'
    END as priority
  FROM companies c
  JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  LEFT JOIN salespeople s ON s.id = cu.vendedor_id
  WHERE c.deleted_at IS NULL
  AND cu.cliente_ativado = true
  AND NOT EXISTS (
    SELECT 1 FROM interactions i 
    WHERE i.company_id = c.id 
    AND i.created_at >= now() - (p_days_inactive || ' days')::interval
  )
  ORDER BY cu.valor_total_compras DESC NULLS LAST
  LIMIT p_limit;
END;
$function$
