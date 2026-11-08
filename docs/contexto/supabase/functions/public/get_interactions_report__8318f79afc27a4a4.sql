CREATE OR REPLACE FUNCTION public.get_interactions_report(p_start_date timestamp with time zone DEFAULT (now() - '30 days'::interval), p_end_date timestamp with time zone DEFAULT now(), p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo', jsonb_build_object('inicio', p_start_date, 'fim', p_end_date),
    'vendedor_id', p_vendedor_id,
    'total_interacoes', (
      SELECT COUNT(*) FROM interactions 
      WHERE created_at BETWEEN p_start_date AND p_end_date
      AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
    ),
    'por_tipo', (
      SELECT jsonb_object_agg(COALESCE(tipo_interacao, 'outros'), cnt)
      FROM (
        SELECT tipo_interacao, COUNT(*) as cnt 
        FROM interactions 
        WHERE created_at BETWEEN p_start_date AND p_end_date
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
        GROUP BY tipo_interacao
      ) t
    ),
    'por_canal', (
      SELECT jsonb_object_agg(COALESCE(canal, 'outros'), cnt)
      FROM (
        SELECT canal, COUNT(*) as cnt 
        FROM interactions 
        WHERE created_at BETWEEN p_start_date AND p_end_date
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
        GROUP BY canal
      ) t
    ),
    'media_por_dia', (
      SELECT ROUND(COUNT(*)::numeric / GREATEST(EXTRACT(days FROM (p_end_date - p_start_date)), 1), 2)
      FROM interactions 
      WHERE created_at BETWEEN p_start_date AND p_end_date
      AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
