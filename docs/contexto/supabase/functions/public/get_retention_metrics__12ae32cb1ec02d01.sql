CREATE OR REPLACE FUNCTION public.get_retention_metrics()
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
    'retenção', jsonb_build_object(
      'clientes_ativos_total', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
      'interagidos_30d', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= now() - interval '30 days'),
      'interagidos_60d', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= now() - interval '60 days'),
      'interagidos_90d', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= now() - interval '90 days'),
      'inativos_30d', (
        SELECT COUNT(*) FROM customers cu
        WHERE cu.cliente_ativado = true AND cu.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '30 days')
      ),
      'taxa_retenção_30d', ROUND(
        (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= now() - interval '30 days')::numeric /
        NULLIF((SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL), 0) * 100, 2
      )
    ),
    'recorrência', jsonb_build_object(
      'clientes_com_2_compras', (SELECT COUNT(*) FROM customers WHERE total_pedidos >= 2 AND deleted_at IS NULL),
      'clientes_com_3_compras', (SELECT COUNT(*) FROM customers WHERE total_pedidos >= 3 AND deleted_at IS NULL),
      'clientes_com_5_compras', (SELECT COUNT(*) FROM customers WHERE total_pedidos >= 5 AND deleted_at IS NULL),
      'taxa_recompra', ROUND(
        (SELECT COUNT(*) FROM customers WHERE total_pedidos >= 2 AND deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL), 0) * 100, 2
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
