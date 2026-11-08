CREATE OR REPLACE FUNCTION public.get_response_time_analysis(p_days integer DEFAULT 30)
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
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.media_horas ASC)
      FROM (
        SELECT 
          s.id as vendedor_id,
          s.nome as vendedor_nome,
          COUNT(*) as total_interacoes,
          -- Tempo médio entre interações por empresa
          ROUND(AVG(EXTRACT(EPOCH FROM (i.created_at - LAG(i.created_at) OVER (PARTITION BY i.company_id ORDER BY i.created_at))) / 3600), 2) as media_horas
        FROM interactions i
        JOIN salespeople s ON s.id = i.usuario_responsavel_id
        WHERE i.created_at >= start_date
        GROUP BY s.id, s.nome
        HAVING COUNT(*) >= 5
      ) t
    ),
    'distribuicao_horaria', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.hora)
      FROM (
        SELECT 
          EXTRACT(HOUR FROM created_at)::int as hora,
          COUNT(*) as total
        FROM interactions
        WHERE created_at >= start_date
        GROUP BY EXTRACT(HOUR FROM created_at)::int
      ) t
    ),
    'distribuicao_diaria', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.dia_semana)
      FROM (
        SELECT 
          EXTRACT(DOW FROM created_at)::int as dia_semana,
          CASE EXTRACT(DOW FROM created_at)::int
            WHEN 0 THEN 'Dom' WHEN 1 THEN 'Seg' WHEN 2 THEN 'Ter'
            WHEN 3 THEN 'Qua' WHEN 4 THEN 'Qui' WHEN 5 THEN 'Sex' WHEN 6 THEN 'Sab'
          END as nome_dia,
          COUNT(*) as total
        FROM interactions
        WHERE created_at >= start_date
        GROUP BY EXTRACT(DOW FROM created_at)::int
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
