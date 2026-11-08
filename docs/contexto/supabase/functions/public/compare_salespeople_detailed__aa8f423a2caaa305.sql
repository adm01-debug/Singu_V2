CREATE OR REPLACE FUNCTION public.compare_salespeople_detailed(p_days integer DEFAULT 30)
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
    'vendedores', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.score DESC)
      FROM (
        SELECT 
          s.id,
          s.nome,
          (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= now() - (p_days || ' days')::interval) as interacoes,
          (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= now() - (p_days || ' days')::interval) as empresas,
          (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND deleted_at IS NULL) as clientes_ativos,
          (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = s.id AND deleted_at IS NULL) as valor_vendas,
          -- Score calculado
          (
            (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= now() - (p_days || ' days')::interval) * 1 +
            (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = s.id AND created_at >= now() - (p_days || ' days')::interval) * 5 +
            (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND deleted_at IS NULL) * 10
          ) as score
        FROM salespeople s
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
