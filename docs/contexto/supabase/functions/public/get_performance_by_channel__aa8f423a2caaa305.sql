CREATE OR REPLACE FUNCTION public.get_performance_by_channel(p_days integer DEFAULT 30)
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
    'por_canal', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          COALESCE(canal, 'Não informado') as canal,
          COUNT(*) as total,
          ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval), 0) * 100, 2) as percentual
        FROM interactions
        WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY canal
      ) t
    ),
    'por_tipo', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          COALESCE(tipo_interacao, 'Não informado') as tipo,
          COUNT(*) as total
        FROM interactions
        WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY tipo_interacao
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
