CREATE OR REPLACE FUNCTION public.get_sales_leaderboard(p_period text DEFAULT 'month'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  date_filter timestamptz;
BEGIN
  date_filter := CASE p_period
    WHEN 'day' THEN date_trunc('day', now())
    WHEN 'week' THEN date_trunc('week', now())
    WHEN 'month' THEN date_trunc('month', now())
    WHEN 'quarter' THEN date_trunc('quarter', now())
    WHEN 'year' THEN date_trunc('year', now())
    ELSE date_trunc('month', now())
  END;
  
  SELECT jsonb_build_object(
    'periodo', p_period,
    'desde', date_filter,
    'leaderboard', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(cu.valor_total_compras), 0) DESC) as posicao,
          s.id,
          s.nome,
          COUNT(i.id) as interacoes,
          (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND ja_comprou = true AND updated_at >= date_filter AND deleted_at IS NULL) as vendas,
          COALESCE(SUM(cu.valor_total_compras), 0) as valor_total
        FROM salespeople s
        LEFT JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at >= date_filter
        LEFT JOIN customers cu ON cu.vendedor_id = s.id AND cu.ja_comprou = true AND cu.updated_at >= date_filter AND cu.deleted_at IS NULL
        GROUP BY s.id, s.nome
        ORDER BY COALESCE(SUM(cu.valor_total_compras), 0) DESC
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
