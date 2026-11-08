CREATE OR REPLACE FUNCTION public.get_avg_conversion_time()
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
    'tempo_medio_dias', jsonb_build_object(
      'empresa_para_primeira_interacao', (
        SELECT ROUND(AVG(EXTRACT(DAY FROM i.created_at - c.created_at)), 2)
        FROM companies c
        JOIN (SELECT company_id, MIN(created_at) as created_at FROM interactions GROUP BY company_id) i ON i.company_id = c.id
        WHERE c.deleted_at IS NULL
      ),
      'empresa_para_cliente', (
        SELECT ROUND(AVG(EXTRACT(DAY FROM cu.created_at - c.created_at)), 2)
        FROM companies c
        JOIN customers cu ON cu.company_id = c.id
        WHERE c.deleted_at IS NULL AND cu.deleted_at IS NULL
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
