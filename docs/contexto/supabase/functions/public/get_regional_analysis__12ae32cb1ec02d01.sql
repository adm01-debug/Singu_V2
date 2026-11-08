CREATE OR REPLACE FUNCTION public.get_regional_analysis()
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
    'por_estado', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          COALESCE(uf, 'N/I') as estado,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'ativo') as ativos,
          ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL)) * 100, 2) as percentual
        FROM companies
        WHERE deleted_at IS NULL
        GROUP BY uf
        ORDER BY COUNT(*) DESC
        LIMIT 15
      ) t
    ),
    'por_cidade', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT 
          COALESCE(cidade, 'N/I') as cidade,
          COALESCE(uf, '') as estado,
          COUNT(*) as total
        FROM companies
        WHERE deleted_at IS NULL
        GROUP BY cidade, uf
        ORDER BY COUNT(*) DESC
        LIMIT 20
      ) t
    ),
    'resumo', jsonb_build_object(
      'total_empresas', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'estados_distintos', (SELECT COUNT(DISTINCT uf) FROM companies WHERE deleted_at IS NULL AND uf IS NOT NULL),
      'cidades_distintas', (SELECT COUNT(DISTINCT cidade) FROM companies WHERE deleted_at IS NULL AND cidade IS NOT NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
