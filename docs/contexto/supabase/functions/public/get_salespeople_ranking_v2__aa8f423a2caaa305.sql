CREATE OR REPLACE FUNCTION public.get_salespeople_ranking_v2(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'ranking', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.score DESC)
      FROM (
        SELECT 
          s.id,
          s.nome,
          COUNT(i.id) as interacoes,
          COUNT(DISTINCT i.company_id) as empresas_atendidas,
          (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL) as clientes_ativados,
          (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = s.id AND ja_comprou = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL) as valor_vendas,
          ROUND(
            COUNT(i.id)::numeric * 1 +
            COUNT(DISTINCT i.company_id)::numeric * 2 +
            (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL)::numeric * 10 +
            (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = s.id AND ja_comprou = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL)::numeric / 1000, 2
          ) as score
        FROM salespeople s
        LEFT JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at >= now() - (p_days || ' days')::interval
        GROUP BY s.id, s.nome
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
