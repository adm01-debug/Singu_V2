CREATE OR REPLACE FUNCTION public.get_communication_channels_efficiency()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'por_canal', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          COALESCE(canal, 'Não informado') as canal,
          COUNT(*) as total,
          COUNT(DISTINCT company_id) as empresas_distintas,
          ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT company_id), 0), 2) as interacoes_por_empresa
        FROM interactions
        WHERE created_at >= now() - interval '90 days'
        GROUP BY canal
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
