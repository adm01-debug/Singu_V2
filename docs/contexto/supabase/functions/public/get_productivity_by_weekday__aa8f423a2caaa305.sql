CREATE OR REPLACE FUNCTION public.get_productivity_by_weekday(p_days integer DEFAULT 90)
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
    'por_dia', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.dia_numero)
      FROM (
        SELECT 
          EXTRACT(DOW FROM created_at)::int as dia_numero,
          CASE EXTRACT(DOW FROM created_at)::int
            WHEN 0 THEN 'Domingo'
            WHEN 1 THEN 'Segunda'
            WHEN 2 THEN 'Terça'
            WHEN 3 THEN 'Quarta'
            WHEN 4 THEN 'Quinta'
            WHEN 5 THEN 'Sexta'
            WHEN 6 THEN 'Sábado'
          END as dia_nome,
          COUNT(*) as total
        FROM interactions
        WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY EXTRACT(DOW FROM created_at)::int
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
