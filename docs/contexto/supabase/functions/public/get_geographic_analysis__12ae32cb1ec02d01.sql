CREATE OR REPLACE FUNCTION public.get_geographic_analysis()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'by_state', (
      SELECT jsonb_object_agg(state, cnt)
      FROM (
        SELECT 
          COALESCE(
            (SELECT uf FROM company_addresses ca WHERE ca.company_id = c.id AND ca.type = 'principal' LIMIT 1),
            'Não informado'
          ) as state,
          COUNT(*) as cnt
        FROM companies c
        WHERE c.deleted_at IS NULL AND c.status = 'ativo'
        GROUP BY 1
        ORDER BY cnt DESC
      ) sub
    ),
    'top_cities', (
      SELECT jsonb_agg(jsonb_build_object('city', city, 'state', state, 'count', cnt))
      FROM (
        SELECT 
          ca.cidade as city,
          ca.uf as state,
          COUNT(*) as cnt
        FROM company_addresses ca
        JOIN companies c ON c.id = ca.company_id
        WHERE c.deleted_at IS NULL AND c.status = 'ativo'
          AND ca.type = 'principal'
        GROUP BY ca.cidade, ca.uf
        ORDER BY cnt DESC
        LIMIT 20
      ) sub
    ),
    'coverage_summary', jsonb_build_object(
      'total_states', (
        SELECT COUNT(DISTINCT uf) FROM company_addresses ca
        JOIN companies c ON c.id = ca.company_id WHERE c.deleted_at IS NULL
      ),
      'total_cities', (
        SELECT COUNT(DISTINCT cidade) FROM company_addresses ca
        JOIN companies c ON c.id = ca.company_id WHERE c.deleted_at IS NULL
      ),
      'companies_with_address', (
        SELECT COUNT(DISTINCT company_id) FROM company_addresses
      )
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
