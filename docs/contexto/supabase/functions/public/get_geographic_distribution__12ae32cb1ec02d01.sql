CREATE OR REPLACE FUNCTION public.get_geographic_distribution()
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
    'por_regiao', jsonb_build_object(
      'sul', (SELECT COUNT(*) FROM companies WHERE uf IN ('RS', 'SC', 'PR') AND deleted_at IS NULL),
      'sudeste', (SELECT COUNT(*) FROM companies WHERE uf IN ('SP', 'RJ', 'MG', 'ES') AND deleted_at IS NULL),
      'centro_oeste', (SELECT COUNT(*) FROM companies WHERE uf IN ('GO', 'MT', 'MS', 'DF') AND deleted_at IS NULL),
      'nordeste', (SELECT COUNT(*) FROM companies WHERE uf IN ('BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'PI', 'AL', 'SE') AND deleted_at IS NULL),
      'norte', (SELECT COUNT(*) FROM companies WHERE uf IN ('AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO') AND deleted_at IS NULL)
    ),
    'top_10_ufs', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT COALESCE(uf, 'N/I') as uf, COUNT(*) as total
        FROM companies WHERE deleted_at IS NULL
        GROUP BY uf ORDER BY COUNT(*) DESC LIMIT 10
      ) t
    ),
    'top_10_cidades', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT COALESCE(cidade, 'N/I') as cidade, uf, COUNT(*) as total
        FROM companies WHERE deleted_at IS NULL
        GROUP BY cidade, uf ORDER BY COUNT(*) DESC LIMIT 10
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
