CREATE OR REPLACE FUNCTION public.get_portfolio_saturation()
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
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total_clientes DESC)
      FROM (
        SELECT 
          s.id,
          s.nome,
          COUNT(cu.id) as total_clientes,
          COUNT(cu.id) FILTER (WHERE cu.cliente_ativado = true) as ativos,
          ROUND(COALESCE(SUM(cu.valor_total_compras), 0), 2) as valor_carteira,
          CASE 
            WHEN COUNT(cu.id) >= 100 THEN 'saturado'
            WHEN COUNT(cu.id) >= 50 THEN 'alto'
            WHEN COUNT(cu.id) >= 20 THEN 'medio'
            ELSE 'baixo'
          END as nivel_saturacao
        FROM salespeople s
        LEFT JOIN customers cu ON cu.vendedor_id = s.id AND cu.deleted_at IS NULL
        GROUP BY s.id, s.nome
      ) t
    ),
    'sem_vendedor', (SELECT COUNT(*) FROM customers WHERE vendedor_id IS NULL AND deleted_at IS NULL),
    'media_por_vendedor', (
      SELECT ROUND(AVG(cnt), 2)
      FROM (SELECT COUNT(*) as cnt FROM customers WHERE deleted_at IS NULL GROUP BY vendedor_id) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
