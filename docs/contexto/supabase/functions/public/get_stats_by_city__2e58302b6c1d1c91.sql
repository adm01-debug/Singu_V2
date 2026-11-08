CREATE OR REPLACE FUNCTION public.get_stats_by_city(p_cidade text, p_uf text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'cidade', p_cidade,
    'uf', p_uf,
    'empresas', (SELECT COUNT(*) FROM companies WHERE LOWER(cidade) = LOWER(p_cidade) AND (p_uf IS NULL OR uf = p_uf) AND deleted_at IS NULL),
    'empresas_ativas', (SELECT COUNT(*) FROM companies WHERE LOWER(cidade) = LOWER(p_cidade) AND (p_uf IS NULL OR uf = p_uf) AND status = 'ativo' AND deleted_at IS NULL),
    'clientes_ativados', (
      SELECT COUNT(*) FROM customers cu 
      JOIN companies c ON c.id = cu.company_id 
      WHERE LOWER(c.cidade) = LOWER(p_cidade) AND (p_uf IS NULL OR c.uf = p_uf) AND cu.cliente_ativado = true AND cu.deleted_at IS NULL
    ),
    'valor_total', (
      SELECT COALESCE(SUM(cu.valor_total_compras), 0) FROM customers cu 
      JOIN companies c ON c.id = cu.company_id 
      WHERE LOWER(c.cidade) = LOWER(p_cidade) AND (p_uf IS NULL OR c.uf = p_uf) AND cu.deleted_at IS NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
