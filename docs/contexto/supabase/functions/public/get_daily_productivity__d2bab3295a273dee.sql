CREATE OR REPLACE FUNCTION public.get_daily_productivity(p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'data', p_date,
    'metricas', jsonb_build_object(
      'empresas_criadas', (SELECT COUNT(*) FROM companies WHERE created_at::date = p_date AND deleted_at IS NULL),
      'contatos_criados', (SELECT COUNT(*) FROM contacts WHERE created_at::date = p_date AND deleted_at IS NULL),
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at::date = p_date),
      'alertas_resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at::date = p_date),
      'followups_completados', (SELECT COUNT(*) FROM interactions WHERE followup_pendente = false AND updated_at::date = p_date)
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.interacoes DESC)
      FROM (
        SELECT s.nome, COUNT(i.id) as interacoes
        FROM salespeople s
        LEFT JOIN interactions i ON i.usuario_responsavel_id = s.id AND i.created_at::date = p_date
        GROUP BY s.id, s.nome
        HAVING COUNT(i.id) > 0
      ) t
    ),
    'horarios_ativos', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.hora)
      FROM (
        SELECT EXTRACT(HOUR FROM created_at)::int as hora, COUNT(*) as total
        FROM interactions
        WHERE created_at::date = p_date
        GROUP BY EXTRACT(HOUR FROM created_at)::int
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
