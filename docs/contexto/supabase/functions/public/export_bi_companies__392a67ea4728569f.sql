CREATE OR REPLACE FUNCTION public.export_bi_companies(p_limit integer DEFAULT 1000)
 RETURNS TABLE(company_id uuid, nome_crm text, cnpj text, cidade text, uf text, status text, total_contatos bigint, total_interacoes bigint, cliente_ativado boolean, ja_comprou boolean, valor_total_compras numeric, ticket_medio numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    COALESCE(c.nome_crm, c.nome_fantasia, c.razao_social)::text as nome_crm,
    c.cnpj::text,
    (SELECT ca.cidade FROM company_addresses ca WHERE ca.company_id = c.id AND ca.is_primary LIMIT 1)::text as cidade,
    (SELECT ca.estado FROM company_addresses ca WHERE ca.company_id = c.id AND ca.is_primary LIMIT 1)::text as uf,
    c.status::text,
    (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id = c.id AND ct.deleted_at IS NULL)::bigint as total_contatos,
    (SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id)::bigint as total_interacoes,
    COALESCE(cu.cliente_ativado, false) as cliente_ativado,
    COALESCE(cu.ja_comprou, false) as ja_comprou,
    COALESCE(cu.valor_total_compras, 0)::numeric as valor_total_compras,
    COALESCE(cu.ticket_medio, 0)::numeric as ticket_medio,
    c.created_at
  FROM companies c
  LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  WHERE c.deleted_at IS NULL
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$function$
