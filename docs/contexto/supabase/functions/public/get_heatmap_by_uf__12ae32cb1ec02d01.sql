CREATE OR REPLACE FUNCTION public.get_heatmap_by_uf()
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
    'por_uf', (
      SELECT jsonb_object_agg(COALESCE(uf, 'N/I'), total)
      FROM (
        SELECT uf, COUNT(*) as total
        FROM companies
        WHERE deleted_at IS NULL
        GROUP BY uf
      ) t
    ),
    'valor_por_uf', (
      SELECT jsonb_object_agg(COALESCE(uf, 'N/I'), valor)
      FROM (
        SELECT c.uf, COALESCE(SUM(cu.valor_total_compras), 0) as valor
        FROM companies c
        LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY c.uf
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
