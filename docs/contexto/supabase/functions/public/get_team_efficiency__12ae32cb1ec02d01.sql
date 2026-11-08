CREATE OR REPLACE FUNCTION public.get_team_efficiency()
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
    'equipe', jsonb_build_object(
      'total_vendedores', (SELECT COUNT(*) FROM salespeople),
      'vendedores_ativos_mes', (SELECT COUNT(DISTINCT usuario_responsavel_id) FROM interactions WHERE created_at >= date_trunc('month', now()))
    ),
    'metricas', jsonb_build_object(
      'interacoes_por_vendedor', ROUND(
        (SELECT COUNT(*)::numeric FROM interactions WHERE created_at >= date_trunc('month', now())) /
        NULLIF((SELECT COUNT(DISTINCT usuario_responsavel_id) FROM interactions WHERE created_at >= date_trunc('month', now())), 0), 2
      ),
      'clientes_por_vendedor', ROUND(
        (SELECT COUNT(*)::numeric FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL) /
        NULLIF((SELECT COUNT(*) FROM salespeople), 0), 2
      ),
      'valor_por_vendedor', ROUND(
        (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE deleted_at IS NULL) /
        NULLIF((SELECT COUNT(*) FROM salespeople), 0), 2
      )
    ),
    'top_3_vendedores', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT s.nome, COUNT(i.id) as interacoes
        FROM salespeople s
        JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at >= date_trunc('month', now())
        GROUP BY s.id, s.nome
        ORDER BY COUNT(i.id) DESC
        LIMIT 3
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
