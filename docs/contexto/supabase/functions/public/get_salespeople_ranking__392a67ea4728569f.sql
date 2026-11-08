CREATE OR REPLACE FUNCTION public.get_salespeople_ranking(p_limit integer DEFAULT 10)
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
    'total_vendedores', (SELECT COUNT(*) FROM salespeople),
    'ranking', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          s.id as vendedor_id,
          s.nome as vendedor_nome,
          COUNT(cu.id) as total_clientes,
          COUNT(cu.id) FILTER (WHERE cu.cliente_ativado = true) as clientes_ativos,
          COALESCE(SUM(cu.valor_total_compras), 0) as total_vendas,
          COALESCE(AVG(cu.ticket_medio), 0) as ticket_medio,
          ROUND(
            (COUNT(*) FILTER (WHERE cu.cliente_ativado = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 2
          ) as taxa_ativacao,
          (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= now() - interval '30 days') as interacoes_30d
        FROM salespeople s
        LEFT JOIN customers cu ON cu.vendedor_id = s.id AND cu.deleted_at IS NULL
        GROUP BY s.id, s.nome
        ORDER BY total_vendas DESC NULLS LAST
        LIMIT p_limit
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
