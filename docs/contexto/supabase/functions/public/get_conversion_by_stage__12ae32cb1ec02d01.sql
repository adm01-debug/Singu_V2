CREATE OR REPLACE FUNCTION public.get_conversion_by_stage()
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
    'funil', jsonb_build_object(
      'empresas_total', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'empresas_com_contato', (SELECT COUNT(DISTINCT c.id) FROM companies c JOIN contacts ct ON ct.company_id = c.id WHERE c.deleted_at IS NULL AND ct.deleted_at IS NULL),
      'empresas_com_interacao', (SELECT COUNT(DISTINCT company_id) FROM interactions),
      'clientes_cadastrados', (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL),
      'clientes_ativos', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
      'clientes_compradores', (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL)
    ),
    'taxas_conversao', jsonb_build_object(
      'empresa_para_contato', ROUND(
        (SELECT COUNT(DISTINCT c.id) FROM companies c JOIN contacts ct ON ct.company_id = c.id WHERE c.deleted_at IS NULL AND ct.deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL), 0) * 100, 2
      ),
      'contato_para_cliente', ROUND(
        (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(DISTINCT c.id) FROM companies c JOIN contacts ct ON ct.company_id = c.id WHERE c.deleted_at IS NULL AND ct.deleted_at IS NULL), 0) * 100, 2
      ),
      'cliente_para_comprador', ROUND(
        (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL), 0) * 100, 2
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
