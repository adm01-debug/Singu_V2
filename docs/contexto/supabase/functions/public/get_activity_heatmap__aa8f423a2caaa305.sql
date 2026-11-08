CREATE OR REPLACE FUNCTION public.get_activity_heatmap(p_days integer DEFAULT 90)
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
    'heatmap', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          EXTRACT(DOW FROM created_at)::int as dia_semana,
          EXTRACT(HOUR FROM created_at)::int as hora,
          COUNT(*) as total
        FROM interactions
        WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY EXTRACT(DOW FROM created_at)::int, EXTRACT(HOUR FROM created_at)::int
        ORDER BY dia_semana, hora
      ) t
    ),
    'legenda_dias', jsonb_build_array('Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb')
  ) INTO result;
  
  RETURN result;
END;
$function$
