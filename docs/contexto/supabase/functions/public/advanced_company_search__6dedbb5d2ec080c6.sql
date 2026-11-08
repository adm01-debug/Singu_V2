CREATE OR REPLACE FUNCTION public.advanced_company_search(p_query text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_uf text DEFAULT NULL::text, p_cidade text DEFAULT NULL::text, p_vendedor_id integer DEFAULT NULL::integer, p_has_interaction boolean DEFAULT NULL::boolean, p_cliente_ativado boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, nome_crm text, razao_social text, cnpj text, uf text, cidade text, status company_status, vendedor_nome text, ultima_interacao timestamp with time zone, total_interacoes bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nome_crm,
    c.razao_social,
    c.cnpj,
    ca.estado::text AS uf,
    ca.cidade::text,
    c.status,
    cu.vendedor_nome,
    (SELECT MAX(i.created_at) FROM interactions i WHERE i.company_id = c.id) as ultima_interacao,
    (SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id) as total_interacoes
  FROM companies c
  LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  LEFT JOIN company_addresses ca ON ca.company_id = c.id AND ca.is_primary
  WHERE c.deleted_at IS NULL
  AND (p_query IS NULL OR (
    c.nome_crm ILIKE '%' || p_query || '%' OR
    c.razao_social ILIKE '%' || p_query || '%' OR
    c.cnpj ILIKE '%' || p_query || '%'
  ))
  AND (p_status IS NULL OR c.status::text = p_status)
  AND (p_uf IS NULL OR ca.estado = p_uf)
  AND (p_cidade IS NULL OR ca.cidade ILIKE '%' || p_cidade || '%')
  AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
  AND (p_cliente_ativado IS NULL OR cu.cliente_ativado = p_cliente_ativado)
  AND (p_has_interaction IS NULL OR (
    (p_has_interaction = true AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id)) OR
    (p_has_interaction = false AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id))
  ))
  ORDER BY c.nome_crm
  LIMIT p_limit;
END;
$function$
