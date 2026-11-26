CREATE OR REPLACE FUNCTION public.get_channel_analysis(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH recent AS (
    SELECT * FROM interactions WHERE created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 3650)))
  ), channels AS (
    SELECT coalesce(channel, 'não informado') AS channel, count(*) AS total,
      count(DISTINCT company_id) AS companies, count(response_time) AS responses,
      avg(response_time) AS response_time,
      count(DISTINCT company_id) FILTER (WHERE EXISTS (
        SELECT 1 FROM deals d WHERE d.company_id = recent.company_id AND d.status = 'ganho'
          AND d.closed_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 3650)))
      )) AS converted
    FROM recent GROUP BY channel
  )
  SELECT jsonb_build_object(
    'periodo_dias', greatest(1, least(coalesce(p_days, 30), 3650)),
    'por_canal', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'canal', channel, 'total', total, 'percentual', round(100.0 * total / nullif((SELECT count(*) FROM recent), 0), 2),
      'empresas_unicas', companies) ORDER BY total DESC), '[]'::jsonb) FROM channels),
    'por_tipo', (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY total DESC), '[]'::jsonb)
      FROM (SELECT coalesce(type, 'outros') AS tipo, count(*) AS total,
        round(100.0 * count(*) / nullif((SELECT count(*) FROM recent), 0), 2) AS percentual
        FROM recent GROUP BY type) t),
    'totais', jsonb_build_object('total_interacoes', (SELECT count(*) FROM recent),
      'empresas_alcancadas', (SELECT count(DISTINCT company_id) FROM recent),
      'media_diaria', round((SELECT count(*) FROM recent)::numeric / greatest(1, least(coalesce(p_days, 30), 3650)), 2)),
    'series', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'channel', channel, 'interaction_count', total,
      'response_rate', CASE WHEN responses > 0 THEN round(100.0 * responses / total, 2) END,
      'avg_response_time', round(response_time, 2),
      'conversion_rate', round(100.0 * converted / nullif(companies, 0), 2)
    ) ORDER BY total DESC), '[]'::jsonb) FROM channels)
  );
$function$
