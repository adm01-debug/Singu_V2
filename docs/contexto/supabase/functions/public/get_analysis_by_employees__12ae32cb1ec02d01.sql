CREATE OR REPLACE FUNCTION public.get_analysis_by_employees()
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
    'por_faixa', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          CASE 
            WHEN c.numero_funcionarios IS NULL THEN 'Não informado'
            WHEN c.numero_funcionarios <= 10 THEN 'Micro (até 10)'
            WHEN c.numero_funcionarios <= 50 THEN 'Pequena (11-50)'
            WHEN c.numero_funcionarios <= 200 THEN 'Média (51-200)'
            ELSE 'Grande (200+)'
          END as faixa,
          COUNT(DISTINCT c.id) as total,
          COALESCE(SUM(cu.valor_total_compras), 0) as valor_total
        FROM companies c
        LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY CASE 
            WHEN c.numero_funcionarios IS NULL THEN 'Não informado'
            WHEN c.numero_funcionarios <= 10 THEN 'Micro (até 10)'
            WHEN c.numero_funcionarios <= 50 THEN 'Pequena (11-50)'
            WHEN c.numero_funcionarios <= 200 THEN 'Média (51-200)'
            ELSE 'Grande (200+)'
          END
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
