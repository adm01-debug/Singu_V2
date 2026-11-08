CREATE OR REPLACE FUNCTION public.get_analysis_by_company_size()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'por_porte', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          COALESCE(c.porte, 'Não informado') as porte,
          COUNT(DISTINCT c.id) as total,
          COUNT(DISTINCT cu.company_id) FILTER (WHERE cu.cliente_ativado = true) as clientes_ativos,
          COALESCE(SUM(cu.valor_total_compras), 0) as valor_total
        FROM companies c
        LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY c.porte
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
