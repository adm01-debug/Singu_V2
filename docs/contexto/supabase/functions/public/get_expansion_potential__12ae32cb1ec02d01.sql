CREATE OR REPLACE FUNCTION public.get_expansion_potential()
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
    'ufs_sem_presenca', (
      SELECT jsonb_agg(uf_br)
      FROM (VALUES ('AC'),('AL'),('AP'),('AM'),('BA'),('CE'),('DF'),('ES'),('GO'),('MA'),
                   ('MT'),('MS'),('MG'),('PA'),('PB'),('PR'),('PE'),('PI'),('RJ'),('RN'),
                   ('RS'),('RO'),('RR'),('SC'),('SP'),('SE'),('TO')) as ufs(uf_br)
      WHERE NOT EXISTS (SELECT 1 FROM companies WHERE uf = uf_br AND deleted_at IS NULL)
    ),
    'ufs_pouca_presenca', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT uf, COUNT(*) as total
        FROM companies
        WHERE deleted_at IS NULL AND uf IS NOT NULL
        GROUP BY uf
        HAVING COUNT(*) < 5
        ORDER BY COUNT(*)
      ) t
    ),
    'oportunidades', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.uf, COUNT(*) as empresas, 
               COUNT(*) FILTER (WHERE cu.ja_comprou = true) as compraram,
               ROUND(COUNT(*) FILTER (WHERE cu.ja_comprou = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as taxa_conversao
        FROM companies c
        LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        WHERE c.deleted_at IS NULL AND c.uf IS NOT NULL
        GROUP BY c.uf
        HAVING COUNT(*) >= 10 AND ROUND(COUNT(*) FILTER (WHERE cu.ja_comprou = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) < 20
        ORDER BY COUNT(*) DESC
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
