CREATE OR REPLACE FUNCTION public.get_regional_coverage()
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
      'sudeste', (SELECT COUNT(*) FROM companies WHERE uf IN ('SP', 'RJ', 'MG', 'ES') AND deleted_at IS NULL),
      'sul', (SELECT COUNT(*) FROM companies WHERE uf IN ('PR', 'SC', 'RS') AND deleted_at IS NULL),
      'nordeste', (SELECT COUNT(*) FROM companies WHERE uf IN ('BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI') AND deleted_at IS NULL),
      'centro_oeste', (SELECT COUNT(*) FROM companies WHERE uf IN ('GO', 'MT', 'MS', 'DF') AND deleted_at IS NULL),
      'norte', (SELECT COUNT(*) FROM companies WHERE uf IN ('AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO') AND deleted_at IS NULL)
    ),
    'valor_por_regiao', jsonb_build_object(
      'sudeste', (SELECT COALESCE(SUM(cu.valor_total_compras), 0) FROM customers cu JOIN companies c ON c.id = cu.company_id WHERE c.uf IN ('SP', 'RJ', 'MG', 'ES') AND c.deleted_at IS NULL AND cu.deleted_at IS NULL),
      'sul', (SELECT COALESCE(SUM(cu.valor_total_compras), 0) FROM customers cu JOIN companies c ON c.id = cu.company_id WHERE c.uf IN ('PR', 'SC', 'RS') AND c.deleted_at IS NULL AND cu.deleted_at IS NULL),
      'nordeste', (SELECT COALESCE(SUM(cu.valor_total_compras), 0) FROM customers cu JOIN companies c ON c.id = cu.company_id WHERE c.uf IN ('BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI') AND c.deleted_at IS NULL AND cu.deleted_at IS NULL),
      'centro_oeste', (SELECT COALESCE(SUM(cu.valor_total_compras), 0) FROM customers cu JOIN companies c ON c.id = cu.company_id WHERE c.uf IN ('GO', 'MT', 'MS', 'DF') AND c.deleted_at IS NULL AND cu.deleted_at IS NULL),
      'norte', (SELECT COALESCE(SUM(cu.valor_total_compras), 0) FROM customers cu JOIN companies c ON c.id = cu.company_id WHERE c.uf IN ('AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO') AND c.deleted_at IS NULL AND cu.deleted_at IS NULL)
    ),
    'top_5_cidades', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT c.cidade, c.uf, COUNT(*) as total
        FROM companies c
        WHERE c.cidade IS NOT NULL AND c.cidade != '' AND c.deleted_at IS NULL
        GROUP BY c.cidade, c.uf
        ORDER BY COUNT(*) DESC
        LIMIT 5
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
