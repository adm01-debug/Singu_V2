CREATE OR REPLACE FUNCTION public.get_conversion_efficiency(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'funil', jsonb_build_object(
      'empresas_novas', (SELECT COUNT(*) FROM companies WHERE created_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL),
      'com_interacao', (SELECT COUNT(DISTINCT c.id) FROM companies c JOIN interactions i ON i.company_id = c.id WHERE c.created_at >= now() - (p_days || ' days')::interval AND c.deleted_at IS NULL),
      'cliente_ativado', (SELECT COUNT(*) FROM customers cu JOIN companies c ON c.id = cu.company_id WHERE c.created_at >= now() - (p_days || ' days')::interval AND cu.cliente_ativado = true AND cu.deleted_at IS NULL),
      'comprou', (SELECT COUNT(*) FROM customers cu JOIN companies c ON c.id = cu.company_id WHERE c.created_at >= now() - (p_days || ' days')::interval AND cu.ja_comprou = true AND cu.deleted_at IS NULL)
    ),
    'taxas', jsonb_build_object(
      'interacao_sobre_empresa', ROUND(
        (SELECT COUNT(DISTINCT c.id) FROM companies c JOIN interactions i ON i.company_id = c.id WHERE c.created_at >= now() - (p_days || ' days')::interval AND c.deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM companies WHERE created_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL), 0) * 100, 2
      ),
      'conversao_final', ROUND(
        (SELECT COUNT(*) FROM customers cu JOIN companies c ON c.id = cu.company_id WHERE c.created_at >= now() - (p_days || ' days')::interval AND cu.ja_comprou = true AND cu.deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM companies WHERE created_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL), 0) * 100, 2
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
