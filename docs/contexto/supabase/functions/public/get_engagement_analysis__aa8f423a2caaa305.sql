CREATE OR REPLACE FUNCTION public.get_engagement_analysis(p_days integer DEFAULT 90)
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
    'engajamento_geral', jsonb_build_object(
      'empresas_com_interacao', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval),
      'empresas_sem_interacao', (
        SELECT COUNT(*) FROM companies c
        WHERE c.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - (p_days || ' days')::interval)
      ),
      'media_interacoes_empresa', ROUND(
        (SELECT COUNT(*)::numeric FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval) /
        NULLIF((SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval), 0), 2
      )
    ),
    'distribuicao', jsonb_build_object(
      'muito_engajadas', (
        SELECT COUNT(*) FROM (
          SELECT company_id FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval
          GROUP BY company_id HAVING COUNT(*) >= 10
        ) t
      ),
      'engajadas', (
        SELECT COUNT(*) FROM (
          SELECT company_id FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval
          GROUP BY company_id HAVING COUNT(*) BETWEEN 5 AND 9
        ) t
      ),
      'pouco_engajadas', (
        SELECT COUNT(*) FROM (
          SELECT company_id FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval
          GROUP BY company_id HAVING COUNT(*) BETWEEN 1 AND 4
        ) t
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
