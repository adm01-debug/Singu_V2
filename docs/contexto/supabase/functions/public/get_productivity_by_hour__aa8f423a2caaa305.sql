CREATE OR REPLACE FUNCTION public.get_productivity_by_hour(p_days integer DEFAULT 30)
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
    'por_hora', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.hora)
      FROM (
        SELECT 
          EXTRACT(HOUR FROM created_at)::int as hora,
          COUNT(*) as total
        FROM interactions
        WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY EXTRACT(HOUR FROM created_at)::int
      ) t
    ),
    'horario_pico', (
      SELECT EXTRACT(HOUR FROM created_at)::int
      FROM interactions
      WHERE created_at >= now() - (p_days || ' days')::interval
      GROUP BY EXTRACT(HOUR FROM created_at)::int
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
