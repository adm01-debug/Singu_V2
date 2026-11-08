CREATE OR REPLACE FUNCTION public.get_realtime_performance()
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
    'ultima_hora', jsonb_build_object(
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - interval '1 hour'),
      'alertas_criados', (SELECT COUNT(*) FROM alerts WHERE created_at >= now() - interval '1 hour'),
      'alertas_resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at >= now() - interval '1 hour')
    ),
    'hoje', jsonb_build_object(
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at::date = CURRENT_DATE),
      'empresas_novas', (SELECT COUNT(*) FROM companies WHERE created_at::date = CURRENT_DATE AND deleted_at IS NULL),
      'clientes_ativados', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at::date = CURRENT_DATE AND deleted_at IS NULL)
    ),
    'vendedores_ativos_hoje', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT s.nome, COUNT(i.id) as interacoes_hoje
        FROM salespeople s
        JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at::date = CURRENT_DATE
        GROUP BY s.id, s.nome
        ORDER BY COUNT(i.id) DESC
        LIMIT 5
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
