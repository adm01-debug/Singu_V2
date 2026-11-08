CREATE OR REPLACE FUNCTION public.list_salespeople_with_metrics()
 RETURNS TABLE(id integer, nome text, email text, total_clientes bigint, clientes_ativos bigint, valor_carteira numeric, interacoes_mes bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.nome,
    s.email,
    COUNT(DISTINCT cu.id) as total_clientes,
    COUNT(DISTINCT cu.id) FILTER (WHERE cu.cliente_ativado = true) as clientes_ativos,
    COALESCE(SUM(cu.valor_total_compras), 0) as valor_carteira,
    (SELECT COUNT(*) FROM interactions i WHERE i.usuario_responsavel_id = s.id AND i.created_at >= date_trunc('month', now())) as interacoes_mes
  FROM salespeople s
  LEFT JOIN customers cu ON cu.vendedor_id = s.id AND cu.deleted_at IS NULL
  GROUP BY s.id, s.nome, s.email
  ORDER BY valor_carteira DESC NULLS LAST;
END;
$function$
