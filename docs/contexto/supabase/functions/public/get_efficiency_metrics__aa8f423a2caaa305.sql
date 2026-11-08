CREATE OR REPLACE FUNCTION public.get_efficiency_metrics(p_days integer DEFAULT 30)
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
    'metricas', jsonb_build_object(
      'interacoes_por_dia', ROUND((SELECT COUNT(*)::numeric FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval) / p_days, 2),
      'empresas_por_interacao', ROUND((SELECT COUNT(DISTINCT company_id)::numeric FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval) / NULLIF((SELECT COUNT(*) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval), 0), 2),
      'taxa_resolucao_alertas', ROUND(
        (SELECT COUNT(*) FROM alerts WHERE resolved_at >= now() - (p_days || ' days')::interval)::numeric /
        NULLIF((SELECT COUNT(*) FROM alerts WHERE created_at >= now() - (p_days || ' days')::interval), 0) * 100, 2
      ),
      'taxa_followup_cumprido', ROUND(
        (SELECT COUNT(*) FROM interactions WHERE followup_pendente = false AND created_at >= now() - (p_days || ' days')::interval)::numeric /
        NULLIF((SELECT COUNT(*) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval), 0) * 100, 2
      )
    ),
    'vendedores_mais_eficientes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT s.nome, COUNT(DISTINCT i.company_id) as empresas, COUNT(i.id) as interacoes,
               ROUND(COUNT(DISTINCT i.company_id)::numeric / NULLIF(COUNT(i.id), 0), 2) as eficiencia
        FROM salespeople s
        JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at >= now() - (p_days || ' days')::interval
        GROUP BY s.id, s.nome
        ORDER BY eficiencia DESC
        LIMIT 5
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
