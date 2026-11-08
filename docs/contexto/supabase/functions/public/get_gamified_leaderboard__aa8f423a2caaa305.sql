CREATE OR REPLACE FUNCTION public.get_gamified_leaderboard(p_days integer DEFAULT 30)
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
    'leaderboard', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY score DESC) as posicao,
          s.id,
          s.nome,
          COUNT(i.id) as interacoes,
          (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL) as novos_clientes,
          ROUND(
            COUNT(i.id)::numeric +
            (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL)::numeric * 10, 0
          ) as score,
          CASE 
            WHEN ROW_NUMBER() OVER (ORDER BY 
              COUNT(i.id)::numeric +
              (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL)::numeric * 10 DESC
            ) = 1 THEN '🥇'
            WHEN ROW_NUMBER() OVER (ORDER BY 
              COUNT(i.id)::numeric +
              (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL)::numeric * 10 DESC
            ) = 2 THEN '🥈'
            WHEN ROW_NUMBER() OVER (ORDER BY 
              COUNT(i.id)::numeric +
              (SELECT COUNT(*) FROM customers WHERE vendedor_id = s.id AND cliente_ativado = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL)::numeric * 10 DESC
            ) = 3 THEN '🥉'
            ELSE ''
          END as medalha
        FROM salespeople s
        LEFT JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at >= now() - (p_days || ' days')::interval
        GROUP BY s.id, s.nome
        ORDER BY score DESC
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
