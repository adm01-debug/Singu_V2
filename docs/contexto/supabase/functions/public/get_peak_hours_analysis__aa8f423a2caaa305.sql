CREATE OR REPLACE FUNCTION public.get_peak_hours_analysis(p_days integer DEFAULT 30)
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
    'por_hora', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.hora)
      FROM (
        SELECT 
          EXTRACT(HOUR FROM created_at)::int as hora,
          COUNT(*) as total,
          ROUND(COUNT(*)::numeric / p_days, 2) as media_diaria
        FROM interactions
        WHERE created_at >= start_date
        GROUP BY EXTRACT(HOUR FROM created_at)::int
      ) t
    ),
    'hora_pico', (
      SELECT EXTRACT(HOUR FROM created_at)::int
      FROM interactions
      WHERE created_at >= start_date
      GROUP BY EXTRACT(HOUR FROM created_at)::int
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ),
    'por_dia_semana', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.dia_num)
      FROM (
        SELECT 
          EXTRACT(DOW FROM created_at)::int as dia_num,
          CASE EXTRACT(DOW FROM created_at)::int
            WHEN 0 THEN 'Domingo' WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça'
            WHEN 3 THEN 'Quarta' WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado'
          END as dia_nome,
          COUNT(*) as total
        FROM interactions
        WHERE created_at >= start_date
        GROUP BY EXTRACT(DOW FROM created_at)::int
      ) t
    ),
    'dia_mais_ativo', (
      SELECT CASE EXTRACT(DOW FROM created_at)::int
        WHEN 0 THEN 'Domingo' WHEN 1 THEN 'Segunda' WHEN 2 THEN 'Terça'
        WHEN 3 THEN 'Quarta' WHEN 4 THEN 'Quinta' WHEN 5 THEN 'Sexta' WHEN 6 THEN 'Sábado'
      END
      FROM interactions
      WHERE created_at >= start_date
      GROUP BY EXTRACT(DOW FROM created_at)::int
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
