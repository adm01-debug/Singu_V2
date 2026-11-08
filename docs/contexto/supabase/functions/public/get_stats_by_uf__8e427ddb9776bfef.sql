CREATE OR REPLACE FUNCTION public.get_stats_by_uf(p_uf text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF p_uf IS NOT NULL THEN
    SELECT jsonb_build_object(
      'uf', p_uf,
      'empresas', (SELECT COUNT(*) FROM companies WHERE uf = p_uf AND deleted_at IS NULL),
      'empresas_ativas', (SELECT COUNT(*) FROM companies WHERE uf = p_uf AND status = 'ativo' AND deleted_at IS NULL),
      'contatos', (SELECT COUNT(*) FROM contacts ct JOIN companies c ON c.id = ct.company_id WHERE c.uf = p_uf AND ct.deleted_at IS NULL),
      'clientes', (SELECT COUNT(*) FROM customers cu JOIN companies c ON c.id = cu.company_id WHERE c.uf = p_uf AND cu.deleted_at IS NULL),
      'valor_total', (SELECT COALESCE(SUM(cu.valor_total_compras), 0) FROM customers cu JOIN companies c ON c.id = cu.company_id WHERE c.uf = p_uf AND cu.deleted_at IS NULL),
      'cidades', (
        SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
        FROM (
          SELECT cidade, COUNT(*) as total FROM companies WHERE uf = p_uf AND deleted_at IS NULL GROUP BY cidade LIMIT 10
        ) t
      )
    ) INTO result;
  ELSE
    SELECT jsonb_build_object(
      'resumo_por_uf', (
        SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
        FROM (
          SELECT 
            COALESCE(uf, 'N/I') as uf,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'ativo') as ativos
          FROM companies WHERE deleted_at IS NULL
          GROUP BY uf
        ) t
      )
    ) INTO result;
  END IF;
  
  RETURN result;
END;
$function$
