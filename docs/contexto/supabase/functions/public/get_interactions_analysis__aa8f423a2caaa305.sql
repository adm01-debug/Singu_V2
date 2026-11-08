CREATE OR REPLACE FUNCTION public.get_interactions_analysis(p_days integer DEFAULT 30)
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
    'totais', jsonb_build_object(
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval),
      'empresas_distintas', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval),
      'vendedores_ativos', (SELECT COUNT(DISTINCT usuario_responsavel_id) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval)
    ),
    'por_tipo', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT COALESCE(tipo_interacao, 'Não informado') as tipo, COUNT(*) as total
        FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY tipo_interacao
      ) t
    ),
    'por_canal', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT COALESCE(canal, 'Não informado') as canal, COUNT(*) as total
        FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval
        GROUP BY canal
      ) t
    ),
    'media_diaria', ROUND(
      (SELECT COUNT(*)::numeric FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval) / p_days, 2
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
