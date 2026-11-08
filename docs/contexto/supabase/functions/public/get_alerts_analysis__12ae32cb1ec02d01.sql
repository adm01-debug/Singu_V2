CREATE OR REPLACE FUNCTION public.get_alerts_analysis()
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
    'resumo', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM alerts),
      'pendentes', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL),
      'resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NOT NULL),
      'taxa_resolucao', ROUND(
        (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NOT NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM alerts), 0) * 100, 2
      )
    ),
    'por_tipo', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT tipo_alerta as tipo, COUNT(*) as total,
          COUNT(*) FILTER (WHERE resolved_at IS NULL) as pendentes
        FROM alerts
        GROUP BY tipo_alerta
      ) t
    ),
    'por_prioridade', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT prioridade, COUNT(*) as total,
          COUNT(*) FILTER (WHERE resolved_at IS NULL) as pendentes
        FROM alerts
        GROUP BY prioridade
        ORDER BY CASE prioridade WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
      ) t
    ),
    'criados_ultima_semana', (
      SELECT COUNT(*) FROM alerts WHERE created_at >= now() - interval '7 days'
    ),
    'pendentes_urgentes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT a.id, c.nome_crm, a.tipo_alerta, a.titulo, a.created_at
        FROM alerts a
        JOIN companies c ON c.id = a.company_id
        WHERE a.resolved_at IS NULL AND a.prioridade = 'high'
        ORDER BY a.created_at DESC
        LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
