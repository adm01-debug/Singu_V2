CREATE OR REPLACE FUNCTION public.get_conversion_velocity()
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
    'conversoes_rapidas', jsonb_build_object(
      'ate_7_dias', (
        SELECT COUNT(*) FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        WHERE cu.ja_comprou = true AND cu.deleted_at IS NULL
        AND EXTRACT(DAY FROM cu.updated_at - c.created_at) <= 7
      ),
      'ate_14_dias', (
        SELECT COUNT(*) FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        WHERE cu.ja_comprou = true AND cu.deleted_at IS NULL
        AND EXTRACT(DAY FROM cu.updated_at - c.created_at) <= 14
      ),
      'ate_30_dias', (
        SELECT COUNT(*) FROM customers cu
        JOIN companies c ON c.id = cu.company_id
        WHERE cu.ja_comprou = true AND cu.deleted_at IS NULL
        AND EXTRACT(DAY FROM cu.updated_at - c.created_at) <= 30
      )
    ),
    'total_conversoes', (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL),
    'media_dias_conversao', (
      SELECT ROUND(AVG(EXTRACT(DAY FROM cu.updated_at - c.created_at)), 2)
      FROM customers cu
      JOIN companies c ON c.id = cu.company_id
      WHERE cu.ja_comprou = true AND cu.deleted_at IS NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
