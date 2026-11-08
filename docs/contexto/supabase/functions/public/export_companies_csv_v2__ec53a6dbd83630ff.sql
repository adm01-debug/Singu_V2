CREATE OR REPLACE FUNCTION public.export_companies_csv_v2(p_vendedor_id integer DEFAULT NULL::integer, p_status text DEFAULT NULL::text, p_limit integer DEFAULT 1000)
 RETURNS TABLE(nome_crm text, cnpj text, email text, telefone text, cidade text, uf text, status text, vendedor text, valor_compras text, cliente_ativo text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.nome_crm,
    c.cnpj,
    c.email,
    c.telefone,
    c.cidade,
    c.uf,
    c.status::text,
    s.nome as vendedor,
    COALESCE(cu.valor_total_compras::text, '0') as valor_compras,
    CASE WHEN cu.cliente_ativado THEN 'Sim' ELSE 'Não' END as cliente_ativo
  FROM companies c
  LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  LEFT JOIN salespeople s ON s.id = cu.vendedor_id
  WHERE c.deleted_at IS NULL
  AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
  AND (p_status IS NULL OR c.status::text = p_status)
  ORDER BY c.nome_crm
  LIMIT p_limit;
END;
$function$
