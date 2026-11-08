CREATE OR REPLACE FUNCTION public.get_interaction_stats(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  start_date timestamptz := now() - (p_days || ' days')::interval;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'totais', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM interactions WHERE created_at >= start_date),
      'empresas_unicas', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= start_date),
      'media_diaria', ROUND((SELECT COUNT(*)::numeric FROM interactions WHERE created_at >= start_date) / p_days, 2),
      'com_followup', (SELECT COUNT(*) FROM interactions WHERE created_at >= start_date AND followup_pendente = true)
    ),
    'por_tipo', (
      SELECT jsonb_object_agg(COALESCE(tipo_interacao, 'outros'), total)
      FROM (
        SELECT tipo_interacao, COUNT(*) as total
        FROM interactions WHERE created_at >= start_date
        GROUP BY tipo_interacao
      ) t
    ),
    'por_canal', (
      SELECT jsonb_object_agg(COALESCE(canal, 'outros'), total)
      FROM (
        SELECT canal, COUNT(*) as total
        FROM interactions WHERE created_at >= start_date
        GROUP BY canal
      ) t
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          s.nome as vendedor,
          COUNT(*) as total,
          COUNT(DISTINCT i.company_id) as empresas,
          ROUND(COUNT(*)::numeric / p_days, 2) as media_diaria
        FROM interactions i
        JOIN salespeople s ON s.id = i.usuario_responsavel_id
        WHERE i.created_at >= start_date
        GROUP BY s.id, s.nome
      ) t
    ),
    'tendencia_semanal', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.semana)
      FROM (
        SELECT 
          date_trunc('week', created_at)::date as semana,
          COUNT(*) as total
        FROM interactions
        WHERE created_at >= start_date
        GROUP BY date_trunc('week', created_at)::date
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
